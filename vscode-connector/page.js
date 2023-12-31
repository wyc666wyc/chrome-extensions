; ((twod) => {
	; (() => {
		"use strict"
		const {
			INVALID,
			GONE,
			MISMATCH,
			MOD_ERR,
			SYNTAX,
			DISALLOWED,
		} = {
			INVALID: ["seeking position failed.", "InvalidStateError"],
			GONE: [
				"A requested file or directory could not be found at the time an operation was processed.",
				"NotFoundError",
			],
			MISMATCH: [
				"The path supplied exists, but was not an entry of requested type.",
				"TypeMismatchError",
			],
			MOD_ERR: [
				"The object can not be modified in this way.",
				"InvalidModificationError",
			],
			SYNTAX: (e) => [
				`Failed to execute 'write' on 'UnderlyingSinkBase': Invalid params passed. ${e}`,
				"SyntaxError",
			],
			ABORT: ["The operation was aborted", "AbortError"],
			SECURITY: [
				"It was determined that certain files are unsafe for access within a Web application, or that too many calls are being made on file resources.",
				"SecurityError",
			],
			DISALLOWED: [
				"The request is not allowed by the user agent or the platform in the current context.",
				"NotAllowedError",
			],
		}
		const File = globalThis.File
		const Blob = globalThis.Blob
		const e = Symbol("adapter")
		const s = Symbol("adapter")
		const c = Symbol("adapter")
		class FileSystemHandle {
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

		class WritableStreamVS extends globalThis.WritableStream {
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

		class FileSystemFileHandle extends FileSystemHandle {
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

		class FileSystemDirectoryHandle extends FileSystemHandle {
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

		class FileWriter {
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
		class FileGS {
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
		class FileGSAsync extends FileGS {
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
		class FileWriterImpl {
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
		class NameSpace {
			constructor(e, t = true) {
				this.kind = "directory"
				this.deleted = false
				this.name = e
				this.writable = t
				this._entries = {}
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
					const t = (this._entries[e] = new NameSpace(e))
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

		class EventEmitter {
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

		let M, eventBus
		const registNameSpace = (options) => {
			const {
				name,
				writeable = true,
				eventEmitter,
				entries
			} = options
			M = new NameSpace(name, writeable)
			if (entries) {
				M._entries = entries
			}
			eventBus = eventEmitter
			return M
		};

		const ee = (e) => new Promise((t) => promiseTimeoutImpl(t, e))
		let te = 0
		const promiseTimeout = async function (e, ...t) {
			await (() => {
				const e = Date.now()
				if (te + 1e3 < e)
					return new Promise((e) =>
						setTimeout(() => {
							; (te = Date.now()), e()
						}, 0)
					)
			})()
			e.apply(this, t)
		}
		const promiseTimeoutImpl = function (e, t) {
			return t ? setTimeout.apply(this, [e, t]) : (promiseTimeout.apply(this, [e]), 0)
		}
		const walk = (e, t) => {
			for (let n = 0, r = e.length;n < r;n++) if (e[n] == t) return true
			return false
		}
		const processor = (...e) => {
			const t = e.length > 1 ? e : e[0]
			if (t?.queryHelper) return t
			const n = Array.isArray(t) ? "array" : typeof t
			if ("function" == n) {
				return (
					"loading" != window.document.readyState
						? t(null)
						: window.addEventListener("DOMContentLoaded", t),
					processor([])
				)
			}
			if ("string" == n) {
				let e = []
				if ("<" == t.trim()[0]) {
					let n = t
					try {
						if (-1 != n.indexOf("<script")) {
							const t = /<script[^>]*>[^<]*<\/script>/g,
								r =
									/([^\r\n\t\f\v= '"]+)(?:=(["'])?((?:.(?!\2?\s+(?:\S+)=|\2))+.)\2?)?/g,
								i = n.match(t)
							i &&
								i.length &&
								((n = n.replace(t, "")),
									i.forEach((t) => {
										const n = t.match(r)
										if (!n || !n.length) return
										const i = {}
										if (
											(n.slice(1, -1).forEach((e) => {
												const t = e.split("="),
													n = t.shift() || e
												i[n] = (t.join("=") || "").replace(/^"|"$/g, "")
											}),
												!i.src)
										)
											return void console.error(
												`ssjq: unable to parse "${t}"`,
												i
											)
										const s = document.createElement("script")
											;["src", "async"].forEach((e) => {
												void 0 !== i[e] && s.setAttribute(e, i[e])
											}),
												e.push(s)
									}))
						}
						const t = /^<([^>]+)>$/.exec(n)
						t && 2 == t.length && (n = `${n}</${t[1].split(" ")[0]}>`)
						const r = new DOMParser().parseFromString(n, "text/html"),
							i = [].slice.call(r.body.children)
						e = i.concat(e)
					} catch (t) {
						console.error(`ssjq: ${t}`), (e = [])
					}
				} else {
					const n = document.querySelectorAll(t)
					e = [].slice.call(n)
				}
				return processor(e)
			}
			if ("array" == n) {
				const e = t,
					n = {},
					r = Object.assign(e, {
						queryHelper: true,
						append: (...t) => (
							t.forEach((t) => {
								const n = e[0]
								n && processor(t).forEach((e) => n.appendChild(processor(e)[0]))
							}),
							processor(e)
						),
						appendTo: (t) => {
							const n = processor(t)
							return e.forEach((e) => n.append(e)), processor(e)
						},
						insertBefore: (t) => {
							const n = [...e]
							if (e.length) {
								const r = processor(t)[0],
									i = r?.parentNode
								i &&
									e.forEach((e) => {
										const t = processor(e)[0]
										t && (i.insertBefore(t, r), n.push(t))
									})
							}
							return processor(n)
						},
						remove: () => (e.forEach((e) => e?.remove(e)), processor([])),
						replaceWith: (t) => {
							const n = e[0]
							if (n) {
								const e = processor(t),
									r = e.shift()
								return (
									n.replaceWith(r),
									e.forEach((e) => {
										r?.parentNode?.insertBefore(e, r.nextSibling)
									}),
									processor(n)
								)
							}
							return processor(e)
						},
						prevAll: (t) => {
							const n = e[0]
							if (!n) return processor([])
							const r = processor(n).parent()?.children(t)
							if (!r || !r.length) return processor([])
							const i = []
							for (let e = 0;e < r.length;e++) {
								const t = r[e]
								if (t == n) break
								i.push(t)
							}
							return processor(i.reverse())
						},
						nextAll: (t) => {
							const n = e[0]
							if (!n) return processor([])
							const r = processor(n).parent()?.children(t)
							if (!r || !r.length) return processor([])
							const i = []
							let s = false
							for (let e = 0;e < r.length;e++) {
								const t = r[e]
								s && i.push(t), t == n && (s = true)
							}
							return processor(i)
						},
						addClass: (t) => (e.forEach((e) => e?.classList.add(t)), processor(e)),
						removeClass: (t) => (
							e.forEach((e) => e?.classList.remove(t)), processor(e)
						),
						toggleClass: (t, n) => (
							true === n
								? r.addClass(t)
								: false === n
									? r.removeClass(t)
									: e.forEach((e) => e?.classList.toggle(t)),
							processor(e)
						),
						hasClass: (t) =>
							!!e.filter((e) => e?.classList.contains(t)).length,
						is: (t) => {
							const n = e[0]
							if (n)
								return ":visible" == t
									? "none" !== window.getComputedStyle(n).display
									: ":checked" == t
										? 1 == n.checked
										: void 0
						},
						attr: (t, n) => {
							if (e.length) {
								const r = (t, n) => {
									null === n
										? e.forEach((e) => e.removeAttribute(t))
										: e.forEach((e) => e.setAttribute(t, n.toString()))
								}
								if ("string" == typeof t) {
									if (void 0 === n) return e[0].getAttribute(t)
									r(t, n)
								} else for (const e of Object.keys(t)) r(e, t[e])
							}
							return processor(e)
						},
						prop: (t, n) => {
							if (e.length) {
								const r = (t, n) => {
									null === n
										? e.forEach((e) => delete e[t])
										: e.forEach((e) => (e[t] = n))
								}
								if ("string" == typeof t) {
									if (void 0 === n) return e[0][t]
									r(t, n)
								} else for (const e of Object.keys(t)) r(e, t[e])
							}
							return processor(e)
						},
						text: (t) => {
							if (e.length) {
								if (void 0 === t) return e.map((e) => e.innerText).join("")
								e.forEach((e) => (e.innerText = t))
							}
							return processor(e)
						},
						html: (t) => {
							if (e.length) {
								if (void 0 === t) return e.map((e) => e.innerHTML).join("")
								e.forEach((e) => (e.innerHTML = t))
							}
							return processor(e)
						},
						closest: (t) => {
							if (e.length) {
								const n = ((e, t) => {
									const n = document.querySelectorAll(t)
									let r = e.parentNode
									for (;r && !walk(n, r);) r = r.parentNode
									return r
								})(e[0], t)
								if (n) return processor(n)
							}
							return processor([])
						},
						parent: () => {
							const t = e[0]
							return processor(t ? t.parentNode : [])
						},
						children: (t) => {
							const n = e[0]
							if (n)
								if (t) {
									if (n.querySelectorAll) {
										const e = n.querySelectorAll(t)
										return processor([].slice.call(e))
									}
								} else if (n.children) return processor([].slice.call(n.children))
							return processor([])
						},
						find: (t) => {
							let n = []
							return (
								e.forEach((e) => {
									processor(e)
										.children(t)
										.each((e, r) => {
											const i = processor(r).find(t).toArray()
											n = [r, ...i]
										})
								}),
								processor(n)
							)
						},
						each: (t) => (e.forEach((e, n) => t(n, e)), processor(e)),
						toArray: () => [...e],
						bind: (t, i) => (
							t.split(" ").forEach((t) => {
								; (n[t] || (n[t] = [])).push(i),
									e.forEach((e) => e.addEventListener(t, i))
							}),
							r
						),
						unbind: (t) => (
							t.split(" ").forEach((t) => {
								n[t] &&
									(n[t].forEach((n) => {
										e.forEach((e) => {
											e.removeEventListener(t, n)
										})
									}),
										(n[t] = []))
							}),
							r
						),
						value: (t) => {
							if (void 0 === t) {
								let t
								return (
									e.reverse().some((e) => {
										if (!e.disabled)
											return "checkbox" != e.type || 1 == e.checked
												? ((t = e.value), true)
												: void 0
									}),
									t
								)
							}
							{
								const n = e.length ? e[e.length - 1] : void 0
								n &&
									("checkbox" == n.type
										? n.value == t && (n.checked = true)
										: n.setAttribute("value", t))
							}
						},
						data: (t) => {
							const n = e[0]
							if (n) return n.dataset[t]
						},
						offset: () =>
							e[0]?.getBoundingClientRect() || {
								left: -1,
								top: -1,
								right: -1,
								bottom: -1,
								x: -1,
								y: -1,
								height: -1,
								width: -1,
							},
						height: () => {
							const t = e[0]
							return (
								(t && (t === window ? window.innerHeight : t.offsetHeight)) ||
								0
							)
						},
						scrollTop: () => {
							const t = e[0]
							return (t && (t.scrollTop || t.pageYOffset)) || 0
						},
						get: (t) => e[t],
						on: (t, n) => (
							t
								.split(" ")
								.forEach((t) => e.forEach((e) => e?.addEventListener(t, n))),
							processor(e)
						),
						off: (t, n) => (
							t
								.split(" ")
								.forEach((t) =>
									e.forEach((e) => e?.removeEventListener(t, n))
								),
							processor(e)
						),
						trigger: (t, ...n) => (
							e.forEach((e) => {
								const r = e[t]
								r && r.apply(e, n)
							}),
							processor(e)
						),
						toggle: (t) => (
							e.forEach((e) => {
								const n = processor(e)
									; (void 0 === t ? n.is(":visible") : !t) ? n.hide() : n.show()
							}),
							processor(e)
						),
						hide: () => (
							e.forEach((e) => {
								const t = e?.style?.display
								t && -1 == t.indexOf("none") && (e.backuped_display = t),
									processor(e).attr("style", "display: none !important")
							}),
							processor(e)
						),
						fadeOut: (t, n) => (
							setTimeout(() => {
								processor(e).hide(), n && setTimeout(n, 1)
							}, t || 0),
							processor(e)
						),
						show: () => (
							e.forEach((e) => {
								e.style.display = e.backuped_display || ""
							}),
							processor(e)
						),
						fadeIn: () => processor(e).show(),
						animate: (t, n, r) => {
							const i = e[0]
							return (
								i.current_action && window.clearInterval(i.current_action),
								(i.current_action = window.setInterval(
									() => {
										if (void 0 !== t.scrollTop) {
											const e = i === window ? document.documentElement : i,
												n = e.scrollTop
											e.scrollTop < t.scrollTop
												? (e.scrollTop = e.scrollTop + 3)
												: (e.scrollTop = e.scrollTop - 3),
												(e.scrollTop === n ||
													Math.abs(e.scrollTop - t.scrollTop) <= 3) &&
												((e.scrollTop = t.scrollTop),
													window.clearInterval(i.current_action),
													delete i.current_action,
													r && r()),
												window.getComputedStyle(e)
										} else
											e.forEach((e) => {
												if (void 0 !== t.height) {
													const n = processor(e).get(0)
													n && n.style && (n.style.height = `${t.height}px`)
												}
											}),
												r && r()
									},
									void 0 === n ? 100 : n
								)),
								processor(e)
							)
						},
					})
				return r
			}
			return processor("undefined" == n || null == t ? [] : [t])
		}
		const isContentWorld = !window.content_world
		const { createEvent } = document
		const errorFn = (e) => e.error
		const TIMED_OUT_ERROR = "Extension communication timed out!"
		const correctReplacer = (e) => ({ "/": "∕", "\\": "⑊" }[e] || e)
		const slashReplacer = (e) => e.replace(/[/:\\]/g, correctReplacer)
		let pe
		const me = (e) => {
			const t = async () => {
				if (!pe) {
					let t
					pe = e()
					try {
						t = await pe
					} catch (e) {
						throw ((pe = void 0), e)
					}
					return (pe = void 0), t
				}
				try {
					await pe
				} catch (e) { }
				return t()
			}
			return t()
		};
		const startWork = async (self) => {
			const Worker = self.Worker
			let instance
			const channel = (({ sendPrefix, listenPrefix, cloneInto }) => {
				let r,
					i,
					s,
					o = 1
				const a = {}
				let c = false
				let l = []
				const d = (e) => {
					const ttt = ++o
					return (a[o] = e), ttt
				}
				const eventDispatch = (eventName, eventOptions) => {
					const { messageType, data, result, n: o } = eventOptions
					const eventHandler = (event, option, obj) => {
						let res
						if (obj) {
							res = createEvent("MutationEvent")
							res.initMutationEvent(
								event,
								false,
								false,
								obj || null,
								void 0,
								void 0,
								JSON.stringify(option),
								MutationEvent.ADDITION
							)
						} else {
							const detail = cloneInto ? cloneInto(option, window.document) : option
							res = new CustomEvent(event, { detail })
						}
						return res
					}
					const targetEvent = eventHandler(eventName,
						{
							m: messageType,
							a: data,
							r: result
						}, o)

					dispatchEvent.apply(window, [targetEvent])
				}
				const u = (u_param) => {
					const {
						m: n,
						r: o,
						a: d,
					} = (u = u_param) instanceof CustomEvent
							? u.detail
							: JSON.parse(u.attrName)
					var u
					if ("bridge.onpurge" == n)
						(async () => {
							await null, s !== window.document.documentElement && m.refresh()
						})()
					else if ("unlock" == n) {
						c = false
						const e = l
							; (l = []), e.forEach((e) => e())
					} else if ("message.response" == n) {
						if (null == o) throw "Invalid Message"
							; ((param1, param2) => {
								let n
								param1 && (n = a[param1]) && (n(param2), delete a[param1])
							})(o, d)
					} else if (r) {
						const s = o
							? (data) => {
								eventDispatch(`${sendPrefix}_${i}`,
									{
										messageType: "message.response",
										data,
										result: o
									})
							}
							: () => { }
						r(
							{
								method: n,
								args: d,
								node: u_param instanceof MutationEvent ? u_param.relatedNode : void 0,
							},
							s
						)
					}
				}
				const f = (e) => {
					e && (i = e),
						i &&
						((s = window.document.documentElement),
							addEventListener(`${listenPrefix}_${i}`, u, true))
				}
				let p = () => { }
				const manage = {
					init: async (init_p) => {
						i ? f() : f(init_p),
							await (function () {
								let e
								return (
									(e = void 0),
									new Promise((promise_p) => {
										const n = window.document.readyState
										"interactive" == n || "complete" == n
											? (e && e(), promise_p())
											: window.addEventListener(
												"DOMContentLoaded",
												() => {
													e && e(), promise_p()
												},
												{ capture: true, once: true }
											)
									})
								)
							})(),
							isContentWorld
								? ((s = document.documentElement),
									(p = () => {
										s !== document.documentElement &&
											(manage.refresh(),
												eventDispatch(`${sendPrefix}_${i}`, { messageType: "unlock", data: void 0, result: null }))
									}))
								: new Promise((e) => {
									if (isContentWorld) throw "not supported"
									{
										const mutationInstance = new MutationObserver((n) => {
											n.some((e) =>
												((e, tggg) => {
													for (let n = 0, r = e.length;n < r;n++)
														if (e[n] === tggg) return true
													return false
												})(e.addedNodes, document.documentElement)
											) && (e(document), mutationInstance.disconnect())
										})
										init_p.observe(document, { childList: true })
									}
								}).then(() => {
									c = true
									manage.send("bridge.onpurge")
									manage.refresh()
								})
					},
					refresh: () => {
						const e = i
						e && (manage.cleanup(), manage.init(e))
					},
					switchId: (e) => {
						i && manage.cleanup(), f(e)
					},
					send: (messageType, data, r, s) => {
						let o, a
						"function" != typeof r && null !== r ? ((o = r), (a = s)) : (a = r),
							isContentWorld && p()
						const u = () =>
							eventDispatch(`${sendPrefix}_${i}`, { messageType, data, result: a ? d(a) : null, n: o })
						c ? l.push(u) : u()
					},
					sendToId: (sendToId_p1, sendToId_p2, sendToId_p3) => {
						eventDispatch(`${sendPrefix}_${sendToId_p1}`, { messageType: sendToId_p2, data: sendToId_p3, result: null })
					},
					setMessageListener: (e) => {
						r = e
					},
					cleanup: () => {
						i &&
							(removeEventListener(`${listenPrefix}_${i}`, u, true),
								(s = void 0),
								(i = void 0))
					},
				}
				return manage
			})({
				sendPrefix: "2C",
				listenPrefix: "2P",
			})
			channel.init("bfaqq")
			self.showOpenFilePicker = async () => []
			self.showDirectoryPicker = async () => {
				let e = 0
				for (;e++ < 50 && !instance;) await ee(100)
				if (!instance)
					throw (
						(alert("No extension is there to communicate."),
							new DOMException("No extension is there to communicate."))
					)
				return instance
			}
			/// 发送读取脚本消息通知, 获取所有脚本列表
			const getUserScripts = (e) =>
				new Promise((reslove) => {
					let n = 1
					const r = () => {
						e.send("userscripts", { action: "list" }, (event) => {
							!event || errorFn(event) ? setTimeout(r, Math.min((n *= 2), 5e3)) : reslove(event.list)
						})
					}
					r()
				})
			const userscripts = await getUserScripts(channel)
			const namespaceInstance = new NameSpace("unused", false)
			!(async function (fff, list, handler) {
				for (const {
					path,
					name,
					namespace,
					requires,
					storage,
				} of list)
					[path, storage, ...requires]
						.filter((e) => e)
						.forEach((path) => {
							const [, flag, ...rest] = path.split("/")
							const namespaces = [slashReplacer(namespace || "<namespace missing>"), slashReplacer(name)]
							flag === "external" && namespaces.push(flag)
							const c = namespaces.reduce(
								(e, t) => (
									e._entries[t] || (e._entries[t] = new NameSpace(t, false)),
									e._entries[t]
								),
								fff
							)
							const fileName = "index.js"
							// const fileName =
							// 	flag === "source"
							// 		? "script.user.js"
							// 		: flag === "storage"
							// 			? "storage.json"
							// 			: rest && rest.length
							// 				? slashReplacer(decodeURIComponent(rest.join("/")))
							// 				: "<name missing>"
							const file = new FileGSAsync(fileName, path, handler)
							c._entries[fileName] = new FileWriterImpl(fileName, file, true)
						})
				new FileSystemDirectoryHandle(fff)
			})(namespaceInstance, userscripts, {
				get: async (e, t, timeStamp) =>
					await me(async () => {
						const { value, lastModified } = await ((channel, t, timeStamp) =>
							new Promise((resolve, reject) => {
								const timer = setTimeout(() => reject(new DOMException(TIMED_OUT_ERROR)), 15e3)
								channel.send(
									"userscripts",
									{ action: "get", path: t, ifNotModifiedSince: timeStamp },
									(result) => {
										clearTimeout(timer)
										if ((result && !errorFn(result) && result.lastModified)) {
											const { value, lastModified } = result
											resolve({ value, lastModified })
										} else {
											reject(result?.error)
										}
									}
								)
							}))(channel, t, timeStamp)
						// console.log('File value', value)
						return new File([value || ""], e, { lastModified })
					}
					),
				set: async (e, t, n) =>
					await me(async () => {
						await ((e, t, n, r) =>
							new Promise((resolve, reject) => {
								const o = setTimeout(() => reject(new DOMException(TIMED_OUT_ERROR)), 15e3)
								e.send(
									"userscripts",
									{ action: "patch", path: t, value: n, lastModified: r },
									(e) => {
										clearTimeout(o), !e || e.error ? reject(e?.error) : resolve()
									}
								)
							}))(channel, t, await n.text(), n.lastModified)
					}),
			})
			const eventEmitter = new EventEmitter()
			const handleFn = async (e, t = {}) => {
				if (!e) {
					if (
						!globalThis.navigator?.storage &&
						"http:" === globalThis.location?.protocol
					)
						throw new Error(
							"Native getDirectory not supported in HTTP context. Please use HTTPS instead or provide an adapter."
						)
					if (!globalThis.navigator?.storage?.getDirectory)
						throw new Error(
							"Native StorageManager.getDirectory() is not supported in current environment. Please provide an adapter instead."
						)
					return globalThis.navigator.storage.getDirectory()
				}
				const n = await e
				const r = typeof n === "function" ? await n(t) : await n.default(t)
				return new FileSystemDirectoryHandle(r)
			}
			instance = await handleFn(registNameSpace, { name: "tc", eventEmitter, entries: namespaceInstance._entries })

			self.FileSystemDirectoryHandle = FileSystemDirectoryHandle
			self.FileSystemFileHandle = FileSystemFileHandle
			self.Worker = new Proxy(Worker, {
				construct: (e, [t, r]) => {
					const workerInstance = new Worker(t, r)
					let ssss
					return new Proxy(workerInstance, {
						get: (target, type) =>
							type === "postMessage"
								? (param) => {
									// console.log('postMessage', param)
									const { method } = param
									if ("listDirectory" !== method && "searchDirectory" !== method) {
										workerInstance.postMessage(param)
									}
									else {
										const { vsWorker, req, method } = param
										setTimeout(() => {
											ssss &&
												ssss({
													data: {
														vsWorker,
														seq: req,
														method,
														type: 1,
														res: { results: [], limitHit: 0 },
													},
												})
										}, 100)
									}
								}
								: [
									"addEventListener",
									"removeEventListener",
									"terminate",
								].includes(type)
									? type === "addEventListener"
										? (listenerType, callback) =>
											"message" === listenerType
												? ((ssss = callback),
													workerInstance.addEventListener(listenerType, (e) => {
														ssss && ssss(e)
													}))
												: workerInstance.addEventListener(listenerType, callback)
										: workerInstance[type].bind(workerInstance)
									: Reflect.get(target, t),
						set: (e, t, n) =>
							"onmessage" === t && "function" == typeof n
								? ((ssss = n), (workerInstance.onmessage = (e) => ssss && ssss(e)))
								: Reflect.set(e, t, n),
					})
				}
			})
			processor(() => {
				const e = setInterval(() => {
					let t = processor(".codicon-folder-opened").parent()[0]
					if (!t) {
						const e = processor(".monaco-text-button"),
							n = e.text()
						"string" == typeof n &&
							-1 != n.indexOf("Open Folder") &&
							(t = e[0])
					} else {
						t.click()
						console.log("vscode-connector FileSystem automatically opened")
						clearInterval(e)
					}
				}, 500)
			})
			console.log("vscode-connector FileSystem registration finished")
		}
		startWork(window)
	})()
})()
