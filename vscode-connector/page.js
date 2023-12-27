; ((twod) => {
	; (() => {
		"use strict"
		const e = Symbol("adapter")
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
		const s = Symbol("adapter")
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
		const c = Symbol("adapter")
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
		const h = globalThis.File
		const u = globalThis.Blob
		const {
			INVALID: f,
			GONE: p,
			MISMATCH: m,
			MOD_ERR: w,
			SYNTAX: y,
			DISALLOWED: g,
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
		class E {
			constructor(e, t, n) {
				e.file,
					(this.fileHandle = e),
					(this.file = n ? t : new h([], t.name, t)),
					(this.size = n ? t.size : 0),
					(this.position = 0)
			}
			async write(e) {
				if (!this.fileHandle.file) throw new DOMException(...p)
				let t = this.file
				if (((e) => "object" == typeof e && void 0 !== e.type)(e))
					if ("write" === e.type) {
						if (
							("number" == typeof e.position &&
								e.position >= 0 &&
								((this.position = e.position),
									this.size < e.position &&
									((this.file = new h(
										[this.file, new ArrayBuffer(e.position - this.size)],
										this.file.name,
										this.file
									)),
										x && x.emit("modified", this.fileHandle))),
								!("data" in e))
						)
							throw new DOMException(...y("write requires a data argument"))
						e = e.data
					} else {
						if ("seek" === e.type) {
							if (Number.isInteger(e.position) && e.position >= 0) {
								if (this.size < e.position) throw new DOMException(...f)
								return void (this.position = e.position)
							}
							throw new DOMException(...y("seek requires a position argument"))
						}
						if ("truncate" === e.type) {
							if (Number.isInteger(e.size) && e.size >= 0)
								return (
									(t =
										e.size < this.size
											? new h([t.slice(0, e.size)], t.name, t)
											: new h(
												[t, new Uint8Array(e.size - this.size)],
												t.name,
												t
											)),
									(this.size = t.size),
									this.position > t.size && (this.position = t.size),
									(this.file = t),
									void (x && x.emit("modified", this.fileHandle))
								)
							throw new DOMException(...y("truncate requires a size argument"))
						}
					}
				e = new u([e])
				let n = this.file
				const r = n.slice(0, this.position),
					i = n.slice(this.position + e.size)
				let s = this.position - r.size
				s < 0 && (s = 0),
					(n = new h([r, new Uint8Array(s), e, i], n.name)),
					(this.size = n.size),
					(this.position += e.size),
					(this.file = n),
					x && x.emit("modified", this.fileHandle)
			}
			async close() {
				if (!this.fileHandle.file) throw new DOMException(...p)
				this.fileHandle.file.set(this.file),
					(this.file = this.position = this.size = null),
					this.fileHandle.onclose && this.fileHandle.onclose(this.fileHandle)
			}
		}
		class v {
			constructor(e = "", t = new h([], e)) {
				this.file = t
			}
			async get() {
				return this.file
			}
			async set(e) {
				this.file = e
			}
		}
		class b {
			constructor(e = "", t = new v(), n = true) {
				; (this.kind = "file"),
					(this.deleted = false),
					(this.file = t instanceof v ? t : new v(e, t)),
					(this.name = e),
					(this.writable = n),
					x && x.emit("created", this)
			}
			async getFile() {
				if (this.deleted || null === this.file) throw new DOMException(...p)
				return await this.file.get()
			}
			async createWritable(e) {
				if (!this.writable) throw new DOMException(...g)
				if (this.deleted) throw new DOMException(...p)
				const t = await this.file.get()
				return new E(this, t, !!e?.keepExistingData)
			}
			async isSameEntry(e) {
				return this === e
			}
			destroy() {
				x && x.emit("deleted", this), (this.deleted = true), (this.file = null)
			}
		}
		class T {
			constructor(e, t = true) {
				; (this.kind = "directory"),
					(this.deleted = false),
					(this.name = e),
					(this.writable = t),
					(this._entries = {}),
					x && x.emit("created", this)
			}
			async *entries() {
				if (this.deleted) throw new DOMException(...p)
				yield* Object.entries(this._entries)
			}
			async isSameEntry(e) {
				return this === e
			}
			async getDirectoryHandle(e, t = {}) {
				if (this.deleted) throw new DOMException(...p)
				const n = this._entries[e]
				if (n) {
					if (n instanceof b) throw new DOMException(...m)
					return n
				}
				if (t.create) {
					const t = (this._entries[e] = new T(e))
					return x && x.emit("created", t), t
				}
				throw new DOMException(...p)
			}
			async getFileHandle(e, t = {}) {
				const n = this._entries[e]
				if (n) {
					if (n instanceof b) return n
					throw new DOMException(...m)
				}
				if (t.create) return (this._entries[e] = new b(e))
				throw new DOMException(...p)
			}
			async removeEntry(e, t = {}) {
				const n = this._entries[e]
				if (!n) throw new DOMException(...p)
				n.destroy(t.recursive), delete this._entries[e]
			}
			destroy(e) {
				for (const t of Object.values(this._entries)) {
					if (!e) throw new DOMException(...w)
					t.destroy(e)
				}
				x && x.emit("deleted", this), (this._entries = {}), (this.deleted = true)
			}
		}
		let M, x
		const S = (options) => {
			const { 
				name, 
				writeable = true, 
				eventEmitter, 
				entries 
			} = options
			M = new T(name, writeable)
			if (entries) {
				M._entries = entries
			}
			x = eventEmitter
			return M
		};
		const {
			AbortController: O,
			FileReader: D,
			TextDecoder: k,
			addEventListener: H,
			atob: P,
			btoa: L,
			clearInterval: _,
			clearTimeout: I,
			crypto: N,
			decodeURIComponent: A,
			encodeURIComponent: F,
			escape: q,
			fetch: j,
			location: z,
			removeEventListener: C,
			setInterval: $,
			setTimeout: W,
			unescape: R,
		} = self
		const {
			DOMParser: B,
			Notification: U,
			Image: Y,
			Worker: X,
			XMLHttpRequest: G,
			alert: J,
			confirm: V,
			document: K,
			localStorage: Q,
			screen: Z,
		} = (self, z.origin, z.host, self)
		const ee = (e) => new Promise((t) => re(t, e))
		let te = 0
		const ne = async function (e, ...t) {
			await (() => {
				const e = Date.now()
				if (te + 1e3 < e)
					return new Promise((e) =>
						W(() => {
							; (te = Date.now()), e()
						}, 0)
					)
			})(),
				e.apply(this, t)
		},
			re = function (e, t) {
				return t ? W.apply(this, [e, t]) : (ne.apply(this, [e]), 0)
			},
			ie = (e, t) => {
				for (let n = 0, r = e.length;n < r;n++) if (e[n] == t) return true
				return false
			},
			se = (...e) => {
				const t = e.length > 1 ? e : e[0]
				if (t?.queryHelper) return t
				const n = Array.isArray(t) ? "array" : typeof t
				if ("function" == n)
					return (
						"loading" != window.document.readyState
							? t(null)
							: window.addEventListener("DOMContentLoaded", t),
						se([])
					)
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
					return se(e)
				}
				if ("array" == n) {
					const e = t,
						n = {},
						r = Object.assign(e, {
							queryHelper: true,
							append: (...t) => (
								t.forEach((t) => {
									const n = e[0]
									n && se(t).forEach((e) => n.appendChild(se(e)[0]))
								}),
								se(e)
							),
							appendTo: (t) => {
								const n = se(t)
								return e.forEach((e) => n.append(e)), se(e)
							},
							insertBefore: (t) => {
								const n = [...e]
								if (e.length) {
									const r = se(t)[0],
										i = r?.parentNode
									i &&
										e.forEach((e) => {
											const t = se(e)[0]
											t && (i.insertBefore(t, r), n.push(t))
										})
								}
								return se(n)
							},
							remove: () => (e.forEach((e) => e?.remove(e)), se([])),
							replaceWith: (t) => {
								const n = e[0]
								if (n) {
									const e = se(t),
										r = e.shift()
									return (
										n.replaceWith(r),
										e.forEach((e) => {
											r?.parentNode?.insertBefore(e, r.nextSibling)
										}),
										se(n)
									)
								}
								return se(e)
							},
							prevAll: (t) => {
								const n = e[0]
								if (!n) return se([])
								const r = se(n).parent()?.children(t)
								if (!r || !r.length) return se([])
								const i = []
								for (let e = 0;e < r.length;e++) {
									const t = r[e]
									if (t == n) break
									i.push(t)
								}
								return se(i.reverse())
							},
							nextAll: (t) => {
								const n = e[0]
								if (!n) return se([])
								const r = se(n).parent()?.children(t)
								if (!r || !r.length) return se([])
								const i = []
								let s = false
								for (let e = 0;e < r.length;e++) {
									const t = r[e]
									s && i.push(t), t == n && (s = true)
								}
								return se(i)
							},
							addClass: (t) => (e.forEach((e) => e?.classList.add(t)), se(e)),
							removeClass: (t) => (
								e.forEach((e) => e?.classList.remove(t)), se(e)
							),
							toggleClass: (t, n) => (
								true === n
									? r.addClass(t)
									: false === n
										? r.removeClass(t)
										: e.forEach((e) => e?.classList.toggle(t)),
								se(e)
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
								return se(e)
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
								return se(e)
							},
							text: (t) => {
								if (e.length) {
									if (void 0 === t) return e.map((e) => e.innerText).join("")
									e.forEach((e) => (e.innerText = t))
								}
								return se(e)
							},
							html: (t) => {
								if (e.length) {
									if (void 0 === t) return e.map((e) => e.innerHTML).join("")
									e.forEach((e) => (e.innerHTML = t))
								}
								return se(e)
							},
							closest: (t) => {
								if (e.length) {
									const n = ((e, t) => {
										const n = document.querySelectorAll(t)
										let r = e.parentNode
										for (;r && !ie(n, r);) r = r.parentNode
										return r
									})(e[0], t)
									if (n) return se(n)
								}
								return se([])
							},
							parent: () => {
								const t = e[0]
								return se(t ? t.parentNode : [])
							},
							children: (t) => {
								const n = e[0]
								if (n)
									if (t) {
										if (n.querySelectorAll) {
											const e = n.querySelectorAll(t)
											return se([].slice.call(e))
										}
									} else if (n.children) return se([].slice.call(n.children))
								return se([])
							},
							find: (t) => {
								let n = []
								return (
									e.forEach((e) => {
										se(e)
											.children(t)
											.each((e, r) => {
												const i = se(r).find(t).toArray()
												n = [r, ...i]
											})
									}),
									se(n)
								)
							},
							each: (t) => (e.forEach((e, n) => t(n, e)), se(e)),
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
								se(e)
							),
							off: (t, n) => (
								t
									.split(" ")
									.forEach((t) =>
										e.forEach((e) => e?.removeEventListener(t, n))
									),
								se(e)
							),
							trigger: (t, ...n) => (
								e.forEach((e) => {
									const r = e[t]
									r && r.apply(e, n)
								}),
								se(e)
							),
							toggle: (t) => (
								e.forEach((e) => {
									const n = se(e)
										; (void 0 === t ? n.is(":visible") : !t) ? n.hide() : n.show()
								}),
								se(e)
							),
							hide: () => (
								e.forEach((e) => {
									const t = e?.style?.display
									t && -1 == t.indexOf("none") && (e.backuped_display = t),
										se(e).attr("style", "display: none !important")
								}),
								se(e)
							),
							fadeOut: (t, n) => (
								setTimeout(() => {
									se(e).hide(), n && setTimeout(n, 1)
								}, t || 0),
								se(e)
							),
							show: () => (
								e.forEach((e) => {
									e.style.display = e.backuped_display || ""
								}),
								se(e)
							),
							fadeIn: () => se(e).show(),
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
														const n = se(e).get(0)
														n && n.style && (n.style.height = `${t.height}px`)
													}
												}),
													r && r()
										},
										void 0 === n ? 100 : n
									)),
									se(e)
								)
							},
						})
					return r
				}
				return se("undefined" == n || null == t ? [] : [t])
			},
			oe = !window.content_world,
			{ createEvent: ae } = document
		class ce {
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
		const le = (e) => e.error,
			de = "Extension communication timed out!"
		class he extends v {
			constructor(e, t, n) {
				super(), (this.name = e), (this.path = t), (this.handler = n)
			}
			async get() {
				const e = await this.handler.get(
					this.name,
					this.path,
					this.cache?.lastModified
				)
				return (
					(this.cache?.lastModified &&
						e.lastModified === this.cache.lastModified) ||
					(this.cache = e),
					this.cache
				)
			}
			async set(e) {
				; (this.cache = e), await this.handler.set(this.name, this.path, e)
			}
		}
		const ue = (e) => ({ "/": "∕", "\\": "⑊" }[e] || e),
			fe = (e) => e.replace(/[/:\\]/g, ue)
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
		}
			; (async (e) => {
				const t = e
				const Worker = e.Worker
				let rrr
				const i = (({ sendPrefix: e, listenPrefix: t, cloneInto: n }) => {
					let r,
						i,
						s,
						o = 1
					const a = {}
					let c = false,
						l = []
					const d = (e) => {
						const t = ++o
						return (a[o] = e), t
					},
						h = (e, t) => {
							const { m: r, a: i, r: s, n: o } = t,
								a = ((e, t, r) => {
									let i
									var s
									return (
										r
											? ((i = ae("MutationEvent")),
												i.initMutationEvent(
													e,
													false,
													false,
													r || null,
													void 0,
													void 0,
													JSON.stringify(t),
													MutationEvent.ADDITION
												))
											: (i = new CustomEvent(e, {
												detail: ((s = t), n ? n(s, window.document) : s),
											})),
										i
									)
								})(e, { m: r, a: i, r: s }, o)
							dispatchEvent.apply(window, [a])
						},
						u = (t) => {
							const {
								m: n,
								r: o,
								a: d,
							} = (u = t) instanceof CustomEvent
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
									; ((e, t) => {
										let n
										e && (n = a[e]) && (n(t), delete a[e])
									})(o, d)
							} else if (r) {
								const s = o
									? (t) => {
										h(`${e}_${i}`, { m: "message.response", a: t, r: o })
									}
									: () => { }
								r(
									{
										method: n,
										args: d,
										node: t instanceof MutationEvent ? t.relatedNode : void 0,
									},
									s
								)
							}
						},
						f = (e) => {
							e && (i = e),
								i &&
								((s = window.document.documentElement),
									addEventListener(`${t}_${i}`, u, true))
						}
					let p = () => { }
					const m = {
						init: async (t) => {
							i ? f() : f(t),
								await (function () {
									let e
									return (
										(e = void 0),
										new Promise((t) => {
											const n = window.document.readyState
											"interactive" == n || "complete" == n
												? (e && e(), t())
												: window.addEventListener(
													"DOMContentLoaded",
													() => {
														e && e(), t()
													},
													{ capture: true, once: true }
												)
										})
									)
								})(),
								oe
									? ((s = document.documentElement),
										(p = () => {
											s !== document.documentElement &&
												(m.refresh(),
													h(`${e}_${i}`, { m: "unlock", a: void 0, r: null }))
										}))
									: new Promise((e) => {
										if (oe) throw "not supported"
										{
											const t = new MutationObserver((n) => {
												n.some((e) =>
													((e, t) => {
														for (let n = 0, r = e.length;n < r;n++)
															if (e[n] === t) return true
														return false
													})(e.addedNodes, document.documentElement)
												) && (e(document), t.disconnect())
											})
											t.observe(document, { childList: true })
										}
									}).then(() => {
										; (c = true), m.send("bridge.onpurge"), m.refresh()
									})
						},
						refresh: () => {
							const e = i
							e && (m.cleanup(), m.init(e))
						},
						switchId: (e) => {
							i && m.cleanup(), f(e)
						},
						send: (t, n, r, s) => {
							let o, a
							"function" != typeof r && null !== r ? ((o = r), (a = s)) : (a = r),
								oe && p()
							const u = () =>
								h(`${e}_${i}`, { m: t, a: n, r: a ? d(a) : null, n: o })
							c ? l.push(u) : u()
						},
						sendToId: (t, n, r) => {
							h(`${e}_${t}`, { m: n, a: r, r: null })
						},
						setMessageListener: (e) => {
							r = e
						},
						cleanup: () => {
							i &&
								(removeEventListener(`${t}_${i}`, u, true),
									(s = void 0),
									(i = void 0))
						},
					}
					return m
				})({
					sendPrefix: "2C",
					listenPrefix: "2P",
				})
				i.init("bfaqq"),
					(e.showOpenFilePicker = async () => []),
					(e.showDirectoryPicker = async () => {
						let e = 0
						for (;e++ < 50 && !rrr;) await ee(100)
						if (!rrr)
							throw (
								(alert("No extension is there to communicate."),
									new DOMException("No extension is there to communicate."))
							)
						return rrr
					})
				const s = await ((e) =>
					new Promise((t) => {
						let n = 1
						const r = () => {
							e.send("userscripts", { action: "list" }, (e) => {
								!e || le(e) ? setTimeout(r, Math.min((n *= 2), 5e3)) : t(e.list)
							})
						}
						r()
					}))(i),
					o = new T("unused", false)
				!(async function (e, t, n) {
					for (const {
						path: r,
						name: i,
						namespace: s,
						requires: o,
						storage: a,
					} of t)
						[r, a, ...o]
							.filter((e) => e)
							.forEach((t) => {
								const [, r, ...o] = t.split("/"),
									a = [fe(s || "<namespace missing>"), fe(i)]
								"external" === r && a.push(r)
								const c = a.reduce(
									(e, t) => (
										e._entries[t] || (e._entries[t] = new T(t, false)),
										e._entries[t]
									),
									e
								),
									l =
										"source" === r
											? "script.user.js"
											: "storage" === r
												? "storage.json"
												: o && o.length
													? fe(decodeURIComponent(o.join("/")))
													: "<name missing>",
									d = new he(l, t, n)
								c._entries[l] = new b(l, d, true)
							})
					new FileSystemDirectoryHandle(e)
				})(o, s, {
					get: async (e, t, timeStamp) =>
						await me(async () => {
							const { value: r, lastModified: s } = await ((e, t, timeStamp) =>
								new Promise((r, i) => {
									const s = setTimeout(() => i(new DOMException(de)), 15e3)
									console.log('send', e, t, timeStamp)
									e.send(
										"userscripts",
										{ action: "get", path: t, ifNotModifiedSince: timeStamp },
										(e) => {
											if ((clearTimeout(s), e && !le(e) && e.lastModified)) {
												const { value: t, lastModified: n } = e
												r({ value: t, lastModified: n })
											} else {
												i(e?.error)
											}
										}
									)
								}))(i, t, timeStamp)
							return new File([r || ""], e, { lastModified: s })
						}),
					set: async (e, t, n) =>
						await me(async () => {
							await ((e, t, n, r) =>
								new Promise((i, s) => {
									const o = setTimeout(() => s(new DOMException(de)), 15e3)
									e.send(
										"userscripts",
										{ action: "patch", path: t, value: n, lastModified: r },
										(e) => {
											clearTimeout(o), !e || e.error ? s(e?.error) : i()
										}
									)
								}))(i, t, await n.text(), n.lastModified)
						}),
				})
				const c = new ce()
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
				rrr = await handleFn(S, { name: "tc", eventEmitter: c, entries: o._entries })

				t.FileSystemDirectoryHandle = FileSystemDirectoryHandle
				t.FileSystemFileHandle = FileSystemFileHandle
				t.Worker = new Proxy(Worker, {
					construct: (e, [t, r]) => {
						console.log('Worker', e, t, r)
						const i = new Worker(t, r)
						let s
						return new Proxy(i, {
							get: (e, t) =>
								"postMessage" === t
									? (e) => {
										const { method: t } = e
										if ("listDirectory" !== t && "searchDirectory" !== t) {
											console.log('searchDirectory', e)
											i.postMessage(e)
										}
										else {
											const { vsWorker: t, req: n, method: r } = e
											setTimeout(() => {
												s &&
													s({
														data: {
															vsWorker: t,
															seq: n,
															method: r,
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
									].includes(t)
										? "addEventListener" === t
											? (e, t) =>
												"message" === e
													? ((s = t),
														i.addEventListener(e, (e) => {
															s && s(e)
														}))
													: i.addEventListener(e, t)
											: i[t].bind(i)
										: Reflect.get(e, t),
							set: (e, t, n) =>
								"onmessage" === t && "function" == typeof n
									? ((s = n), (i.onmessage = (e) => s && s(e)))
									: Reflect.set(e, t, n),
						})
					}
				})
				se(() => {
					const e = setInterval(() => {
						let t = se(".codicon-folder-opened").parent()[0]
						if (!t) {
							const e = se(".monaco-text-button"),
								n = e.text()
							"string" == typeof n &&
								-1 != n.indexOf("Open Folder") &&
								(t = e[0])
						}
						t &&
							(t.click(),
								console.log("Tampermonkey FileSystem automatically opened"),
								clearInterval(e))
					}, 500)
				})
				console.log("Tampermonkey FileSystem registration finished")
			})(window)
	})()
})()
