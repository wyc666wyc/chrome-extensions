;(() => {
  ;(() => {
    "use strict"
    const e = !window.content_world
    const { createEvent: n } = document
    const { runtime } = chrome
    ;(async () => {
      const eventManagerFn = ({
        sendPrefix: t,
        listenPrefix: o,
        cloneInto: s,
      }) => {
        let i,
          r,
          d,
          c = 1
        const a = {}
        let u = false
        let l = []
        const m = (e) => {
          const n = ++c
          return (a[c] = e), n
        }
        const eventDispatch = (eventName, eventOptions) => {
          const { messageType, data, result, n: d } = eventOptions
          const c = ((e, t, o) => {
            let i
            var r
            return (
              o
                ? ((i = n("MutationEvent")),
                  i.initMutationEvent(
                    e,
                    false,
                    false,
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
          })(eventName, { messageType, data, result }, d)
          dispatchEvent.apply(window, [c])
        }
        const v = (e) => {
          const { messageType, result, data } =
            (c = e) instanceof CustomEvent ? c.detail : JSON.parse(c.attrName)
          var c
          if ("bridge.onpurge" == messageType)
            (async () => {
              await null,
                d !== window.document.documentElement && manager.refresh()
            })()
          else if ("unlock" == messageType) {
            u = false
            const e = l
            ;(l = []), e.forEach((e) => e())
          } else if ("message.response" == messageType) {
            if (null == result) throw "Invalid Message"
            ;((e, n) => {
              let t
              e && (t = a[e]) && (t(n), delete a[e])
            })(result, data)
          } else if (i) {
            const d = result
              ? (e) => {
                  eventDispatch(`${t}_${r}`, {
                    messageType: "message.response",
                    data: e,
                    result,
                  })
                }
              : () => {}
            i(
              {
                method: messageType,
                args: data,
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
              addEventListener(`${o}_${r}`, v, true))
        }
        let p = () => {}
        const manager = {
          init: async (token) => {
            r ? f() : f(token)
            await (function () {
              return new Promise((reslove) => {
                const readyState = window.document.readyState
                readyState == "interactive" || readyState == "complete"
                  ? reslove()
                  : window.addEventListener(
                      "DOMContentLoaded",
                      () => {
                        reslove()
                      },
                      { capture: true, once: true }
                    )
              })
            })()
            e
              ? ((d = document.documentElement),
                (p = () => {
                  d !== document.documentElement &&
                    (manager.refresh(),
                    eventDispatch(`${t}_${r}`, {
                      messageType: "unlock",
                      data: void 0,
                      result: null,
                    }))
                }))
              : new Promise((n) => {
                  if (e) throw "not supported"
                  {
                    const e = new MutationObserver((t) => {
                      t.some((e) =>
                        ((e, n) => {
                          for (let t = 0, o = e.length; t < o; t++)
                            if (e[t] === n) return true
                          return false
                        })(e.addedNodes, document.documentElement)
                      ) && (n(document), e.disconnect())
                    })
                    e.observe(document, { childList: true })
                  }
                }).then(() => {
                  u = true
                  manager.send("bridge.onpurge")
                  manager.refresh()
                })
          },
          refresh: () => {
            const e = r
            e && (manager.cleanup(), manager.init(e))
          },
          switchId: (e) => {
            r && manager.cleanup(), f(e)
          },
          send: (n, o, s, i) => {
            let d, c
            "function" != typeof s && null !== s ? ((d = s), (c = i)) : (c = s),
              e && p()
            const a = () =>
              eventDispatch(`${t}_${r}`, {
                messageType: n,
                data: o,
                result: c ? m(c) : null,
                n: d,
              })
            u ? l.push(a) : a()
          },
          sendToId: (e, n, o) => {
            eventDispatch(`${t}_${e}`, {
              messageType: n,
              data: o,
              result: null,
            })
          },
          setMessageListener: (e) => {
            i = e
          },
          cleanup: () => {
            r &&
              (removeEventListener(`${o}_${r}`, v, true),
              (d = void 0),
              (r = void 0))
          },
        }
        return manager
      }

      const manager = eventManagerFn({ sendPrefix: "2P", listenPrefix: "2C" })
      manager.init("bfaqq")
      manager.setMessageListener((e, n) => {
        runtime.sendMessage({ ...e, method: "userscripts" }, (e) => {
          console.log("sendMessage", e, n)
          n(e)
        })
      })
    })(window)
  })()
})()
