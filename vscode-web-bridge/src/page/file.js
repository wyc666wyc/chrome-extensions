import {
    INVALID,
    GONE,
    MISMATCH,
    MOD_ERR,
    SYNTAX,
    DISALLOWED,
    ABORT,
    SECURITY
} from './constant'

const File = globalThis.File
const Blob = globalThis.Blob
const e = Symbol("adapter")
const s = Symbol("adapter")
const c = Symbol("adapter")

export class FileSystemHandle {
    constructor(param) {
        this.kind = param.kind
        this.name = param.name
        this[e] = param
    }
    get isFile() {
        return "file" === this.kind
    }
    get isDirectory() {
        return "directory" === this.kind
    }
    async queryPermission(param = { mode: "read" }) {
        const { mode } = param
        const n = this[e]
        if (n.queryPermission) return n.queryPermission(param)
        if ("read" === mode) return "granted"
        if ("readwrite" === mode) return n.writable ? "granted" : "denied"
        throw new TypeError(`Mode ${mode} must be 'read' or 'readwrite'`)
    }
    async requestPermission(param = { mode: "read" }) {
        const { mode } = param
        const n = this[e]
        if (n.requestPermission) return n.requestPermission(param)
        if ("read" === mode) return "granted"
        if ("readwrite" === mode) return n.writable ? "granted" : "denied"
        throw new TypeError(`Mode ${mode} must be 'read' or 'readwrite'`)
    }
    async isSameEntry(param) {
        return (
            this === param ||
            (this.kind === param.kind && !!param[e] && (await this[e].isSameEntry(param[e])))
        )
    }
}
Object.defineProperty(FileSystemHandle.prototype, Symbol.toStringTag, {
    value: "FileSystemHandle",
    writable: false,
    enumerable: false,
    configurable: true,
})

export class WritableStreamVS extends globalThis.WritableStream {
    constructor(e, t) {
        super(e, t)
        this._closed = false
        Object.setPrototypeOf(this, WritableStreamVS.prototype)
    }
    close() {
        this._closed = true
        const e = this.getWriter(),
            t = e.close()
        return e.releaseLock(), t
    }
    seek(e) {
        return this.write({ type: "seek", position: e })
    }
    truncate(e) {
        return this.write({ type: "truncate", size: e })
    }
    write(e) {
        if (this._closed)
            return Promise.reject(
                new TypeError("Cannot write to a CLOSED writable stream")
            )
        const t = this.getWriter(),
            n = t.write(e)
        return t.releaseLock(), n
    }
}
Object.defineProperty(WritableStreamVS.prototype, Symbol.toStringTag, {
    value: "FileSystemWritableFileStream",
    writable: false,
    enumerable: false,
    configurable: true,
})
Object.defineProperties(WritableStreamVS.prototype, {
    close: { enumerable: true },
    seek: { enumerable: true },
    truncate: { enumerable: true },
    write: { enumerable: true },
})

export class FileSystemFileHandle extends FileSystemHandle {
    constructor(e) {
        super(e)
        this.kind = "file"
        this[s] = e
    }
    async createWritable(e = {}) {
        return new WritableStreamVS(await this[s].createWritable(e))
    }
    async getFile() {
        return this[s].getFile()
    }
}
Object.defineProperty(FileSystemFileHandle.prototype, Symbol.toStringTag, {
    value: "FileSystemFileHandle",
    writable: false,
    enumerable: false,
    configurable: true,
})
Object.defineProperties(FileSystemFileHandle.prototype, {
    createWritable: { enumerable: true },
    getFile: { enumerable: true },
})

export class FileSystemDirectoryHandle extends FileSystemHandle {
    constructor(e) {
        super(e)
        this.kind = "directory"
        this[c] = e
    }
    async getDirectoryHandle(e, t = {}) {
        if ("" === e) throw new TypeError("Name can't be an empty string.")
        if ("." === e || ".." === e || e.includes("/"))
            throw new TypeError("Name contains invalid characters.")
        return new FileSystemDirectoryHandle(await this[c].getDirectoryHandle(e, t))
    }
    getDirectory(e, t = {}) {
        return this.getDirectoryHandle(e, t)
    }
    async *entries() {
        for await (const [, e] of this[c].entries())
            yield [e.name, "file" === e.kind ? new FileSystemFileHandle(e) : new FileSystemDirectoryHandle(e)]
    }
    async *getEntries() {
        return this.entries()
    }
    async *keys() {
        for await (const [e] of this[c].entries()) yield e
    }
    async *values() {
        for await (const [, e] of this.entries()) yield e
    }
    async getFileHandle(e, t = {}) {
        if ("" === e) throw new TypeError("Name can't be an empty string.")
        if ("." === e || ".." === e || e.includes("/"))
            throw new TypeError("Name contains invalid characters.")
        return (t.create = !!t.create), new FileSystemFileHandle(await this[c].getFileHandle(e, t))
    }
    getFile(e, t = {}) {
        return this.getFileHandle(e, t)
    }
    async removeEntry(e, t = {}) {
        if ("" === e) throw new TypeError("Name can't be an empty string.")
        if ("." === e || ".." === e || e.includes("/"))
            throw new TypeError("Name contains invalid characters.")
        return (t.recursive = !!t.recursive), this[c].removeEntry(e, t)
    }
    async resolve(e) {
        if (await e.isSameEntry(this)) return []
        const t = [{ handle: this, path: [] }]
        for (;t.length;) {
            const { handle: n, path: r } = t.pop()
            for await (const i of n.values()) {
                if (await i.isSameEntry(e)) return [...r, i.name]
                "directory" === i.kind &&
                    t.push({ handle: i, path: [...r, i.name] })
            }
        }
        return null
    }
    [Symbol.asyncIterator]() {
        return this.entries()
    }
}
Object.defineProperty(FileSystemDirectoryHandle.prototype, Symbol.toStringTag, {
    value: "FileSystemDirectoryHandle",
    writable: false,
    enumerable: false,
    configurable: true,
})
Object.defineProperties(FileSystemDirectoryHandle.prototype, {
    getDirectoryHandle: { enumerable: true },
    entries: { enumerable: true },
    getFileHandle: { enumerable: true },
    removeEntry: { enumerable: true },
})

export class FileWriter {
    constructor(e, t, n) {
        e.file,
            (this.fileHandle = e),
            (this.file = n ? t : new File([], t.name, t)),
            (this.size = n ? t.size : 0),
            (this.position = 0)
    }
    async write(e) {
        if (!this.fileHandle.file) throw new DOMException(...GONE)
        let t = this.file
        if (((e) => "object" == typeof e && void 0 !== e.type)(e))
            if ("write" === e.type) {
                if (
                    ("number" == typeof e.position &&
                        e.position >= 0 &&
                        ((this.position = e.position),
                            this.size < e.position &&
                            ((this.file = new File(
                                [this.file, new ArrayBuffer(e.position - this.size)],
                                this.file.name,
                                this.file
                            )),
                            eventBus && eventBus.emit("modified", this.fileHandle))),
                        !("data" in e))
                )
                    throw new DOMException(...SYNTAX("write requires a data argument"))
                e = e.data
            } else {
                if ("seek" === e.type) {
                    if (Number.isInteger(e.position) && e.position >= 0) {
                        if (this.size < e.position) throw new DOMException(...INVALID)
                        return void (this.position = e.position)
                    }
                    throw new DOMException(...SYNTAX("seek requires a position argument"))
                }
                if ("truncate" === e.type) {
                    if (Number.isInteger(e.size) && e.size >= 0)
                        return (
                            (t =
                                e.size < this.size
                                    ? new File([t.slice(0, e.size)], t.name, t)
                                    : new File(
                                        [t, new Uint8Array(e.size - this.size)],
                                        t.name,
                                        t
                                    )),
                            (this.size = t.size),
                            this.position > t.size && (this.position = t.size),
                            (this.file = t),
                            void (eventBus && eventBus.emit("modified", this.fileHandle))
                        )
                    throw new DOMException(...SYNTAX("truncate requires a size argument"))
                }
            }
        e = new Blob([e])
        let n = this.file
        const r = n.slice(0, this.position),
            i = n.slice(this.position + e.size)
        let s = this.position - r.size
        s < 0 && (s = 0),
            (n = new File([r, new Uint8Array(s), e, i], n.name)),
            (this.size = n.size),
            (this.position += e.size),
            (this.file = n),
            eventBus && eventBus.emit("modified", this.fileHandle)
    }
    async close() {
        if (!this.fileHandle.file) throw new DOMException(...GONE)
        this.fileHandle.file.set(this.file),
            (this.file = this.position = this.size = null),
            this.fileHandle.onclose && this.fileHandle.onclose(this.fileHandle)
    }
}
export class FileGS {
    constructor(e = "", t = new File([], e)) {
        this.file = t
    }
    async get() {
        return this.file
    }
    async set(e) {
        this.file = e
    }
}
export class FileGSAsync extends FileGS {
    constructor(name, path, handler) {
        super()
        this.name = name
        this.path = path
        this.handler = handler
    }
    async get() {
        const { cache, handler, name, path } = this
        const response = await handler.get(name, path, cache?.lastModified);
        if (cache?.lastModified && response.lastModified === cache.lastModified) {
            return cache;
        } else {
            this.cache = response;
            return response;
        }
    }
    async set(e) {
        this.cache = e
        await this.handler.set(this.name, this.path, e)
    }
}
export class FileWriterImpl {
    constructor(e = "", file = new FileGS(), n = true) {
        this.kind = "file"
        this.deleted = false
        this.file = file instanceof FileGS ? file : new FileGS(e, file)
        this.name = e
        this.writable = n
        eventBus && eventBus.emit("created", this)
    }
    async getFile() {
        if (this.deleted || null === this.file) throw new DOMException(...GONE)
        return await this.file.get()
    }
    async createWritable(e) {
        if (!this.writable) throw new DOMException(...DISALLOWED)
        if (this.deleted) throw new DOMException(...GONE)
        const t = await this.file.get()
        return new FileWriter(this, t, !!e?.keepExistingData)
    }
    async isSameEntry(e) {
        return this === e
    }
    destroy() {
        eventBus && eventBus.emit("deleted", this), (this.deleted = true), (this.file = null)
    }
}
export class FileDirectoryHandler {
    constructor(e, t = true) {
        ; (this.kind = "directory"),
            (this.deleted = false),
            (this.name = e),
            (this.writable = t),
            (this._entries = {}),
            eventBus && eventBus.emit("created", this)
    }
    async *entries() {
        if (this.deleted) throw new DOMException(...GONE)
        yield* Object.entries(this._entries)
    }
    async isSameEntry(e) {
        return this === e
    }
    async getDirectoryHandle(e, t = {}) {
        if (this.deleted) throw new DOMException(...GONE)
        const n = this._entries[e]
        if (n) {
            if (n instanceof FileWriterImpl) throw new DOMException(...MISMATCH)
            return n
        }
        if (t.create) {
            const t = (this._entries[e] = new FileDirectoryHandler(e))
            return eventBus && eventBus.emit("created", t), t
        }
        throw new DOMException(...GONE)
    }
    async getFileHandle(e, t = {}) {
        const n = this._entries[e]
        if (n) {
            if (n instanceof FileWriterImpl) return n
            throw new DOMException(...MISMATCH)
        }
        if (t.create) return (this._entries[e] = new FileWriterImpl(e))
        throw new DOMException(...GONE)
    }
    async removeEntry(e, t = {}) {
        const n = this._entries[e]
        if (!n) throw new DOMException(...GONE)
        n.destroy(t.recursive), delete this._entries[e]
    }
    destroy(e) {
        for (const t of Object.values(this._entries)) {
            if (!e) throw new DOMException(...MOD_ERR)
            t.destroy(e)
        }
        eventBus && eventBus.emit("deleted", this), (this._entries = {}), (this.deleted = true)
    }
}

export class EventEmitter {
    constructor() {
        this.events = {}
    }
    on(e, t) {
        const { events: n } = this
        let r = n[e]
        return r || ((r = []), (n[e] = r)), r.push(t), () => this.off(e, t)
    }
    once(e, t) {
        const n = this.on(e, (...e) => (n(), t.bind(this)(...e)))
        return n
    }
    off(e, t) {
        const n = this.events[e]
        if (n) {
            const e = n.indexOf(t)
            e >= 0 && n.splice(e, 1)
        }
    }
    emit(e, ...t) {
        const n = this.events[e]
        if (n) for (const e of n) if (e(...t)) return true
        return false
    }
}