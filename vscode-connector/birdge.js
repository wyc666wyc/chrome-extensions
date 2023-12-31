; (() => {
	; (() => {
		"use strict"
		const e = !window.content_world
		const { createEvent } = document
		const { runtime } = chrome
			; (async () => {
				const channel = (({ sendPrefix: t, listenPrefix: o, cloneInto: s }) => {
					let listener,
						r,
						d,
						c = 1
					const a = {}
					let u = !1,
						l = []
					const m = (e) => {
						const n = ++c
						return (a[c] = e), n
					}
					const w = (e, t) => {
						const { m: o, a: i, r, n: d } = t,
							c = ((e, t, o) => {
								let i
								var r
								return (
									o
										? ((i = createEvent("MutationEvent")),
											i.initMutationEvent(
												e,
												!1,
												!1,
												o || null,
												void 0,
												void 0,
												JSON.stringify(t),
												MutationEvent.ADDITION
											))
										: (i = new CustomEvent(e, {
											detail: ((r = t), s ? s(r, window.document) : r),
										})),
									i
								)
							})(e, { m: o, a: i, r }, d)
						dispatchEvent.apply(window, [c])
					}
					const v = (e) => {
						const {
							m: n,
							r: o,
							a: s,
						} = (c = e) instanceof CustomEvent
								? c.detail
								: JSON.parse(c.attrName)
						var c
						if ("bridge.onpurge" == n)
							(async () => {
								await null, d !== window.document.documentElement && E.refresh()
							})()
						else if ("unlock" == n) {
							u = !1
							const e = l
								; (l = []), e.forEach((e) => e())
						} else if ("message.response" == n) {
							if (null == o) throw "Invalid Message"
								; ((e, n) => {
									let t
									e && (t = a[e]) && (t(n), delete a[e])
								})(o, s)
						} else if (listener) {
							const d = o
								? (e) => {
									w(`${t}_${r}`, { m: "message.response", a: e, r: o })
								}
								: () => { }
							listener(
								{
									method: n,
									args: s,
									node: e instanceof MutationEvent ? e.relatedNode : void 0,
								},
								d
							)
						}
					}
					const f = (e) => {
						e && (r = e),
							r &&
							((d = window.document.documentElement),
								addEventListener(`${o}_${r}`, v, !0))
					}
					let p = () => { }
					const E = {
						init: async (n) => {
							r ? f() : f(n),
								await (function () {
									let e
									return (
										(e = void 0),
										new Promise((n) => {
											const t = window.document.readyState
											"interactive" == t || "complete" == t
												? (e && e(), n())
												: window.addEventListener(
													"DOMContentLoaded",
													() => {
														e && e(), n()
													},
													{ capture: !0, once: !0 }
												)
										})
									)
								})(),
								e
									? ((d = document.documentElement),
										(p = () => {
											d !== document.documentElement &&
												(E.refresh(),
													w(`${t}_${r}`, { m: "unlock", a: void 0, r: null }))
										}))
									: new Promise((n) => {
										if (e) throw "not supported"
										{
											const e = new MutationObserver((t) => {
												t.some((e) =>
													((e, n) => {
														for (let t = 0, o = e.length;t < o;t++)
															if (e[t] === n) return !0
														return !1
													})(e.addedNodes, document.documentElement)
												) && (n(document), e.disconnect())
											})
											e.observe(document, { childList: !0 })
										}
									}).then(() => {
										; (u = !0), E.send("bridge.onpurge"), E.refresh()
									})
						},
						refresh: () => {
							const e = r
							e && (E.cleanup(), E.init(e))
						},
						switchId: (e) => {
							r && E.cleanup(), f(e)
						},
						send: (n, o, s, i) => {
							let d, c
							"function" != typeof s && null !== s ? ((d = s), (c = i)) : (c = s),
								e && p()
							const a = () =>
								w(`${t}_${r}`, { m: n, a: o, r: c ? m(c) : null, n: d })
							u ? l.push(a) : a()
						},
						sendToId: (e, n, o) => {
							w(`${t}_${e}`, { m: n, a: o, r: null })
						},
						setMessageListener: (listenerFn) => {
							listener = listenerFn
						},
						cleanup: () => {
							r &&
								(removeEventListener(`${o}_${r}`, v, !0),
									(d = void 0),
									(r = void 0))
						},
					}
					return E
				})({ sendPrefix: "2P", listenPrefix: "2C" })
				channel.init("bfaqq")
				channel.setMessageListener((e, n) => {
					runtime.sendMessage({ ...e, method: "userscripts" }, (e) => {
						n(e)
					})
				})
				let temp
				let promiseStatus
				runtime.onMessage.addListener((message, sender, sendResponse) => {
					const { messageType, args } = message
					if (args.method === 'get') {
						if (temp) {
							sendResponse(temp)
							temp = null
							return
						}
						window.postMessage({
							...args,
						}, '*')
					}
					const promise = new Promise((resolve) => {
						promiseStatus = resolve
					})
					promise.then(res => {
						temp = res
					})
				})
				window.addEventListener('message', ({ data }) => {
					const { method, value, lastModified } = data
					if (method === 'getValue') {
						promiseStatus && promiseStatus({
							value,
							lastModified
						})
					}
				})
			})(window)
	})()
})()
