; (() => {
    "use strict"
    let e
    Object.fromEntries
        ? (e = Object.fromEntries)
        : ((e = (e) => [...e].reduce((e, [t, a]) => ((e[t] = a), e), {})),
            (Object.fromEntries = e))
    let t = 0
    const a = []
    const n = () => {
        const e = ["debug"],
            a = ["log"],
            n = ["warn", "info"],
            s = ["error"],
            r = [...e, ...a, ...n, ...s],
            i = s
        t >= 80 && i.push(...e),
            t >= 60 && i.push(...a),
            t >= 30 && i.push(...n),
            r.forEach(
                (e) => (o[e] = i.includes(e) ? console[e].bind(console) : () => { })
            )
    }
    const o = {
        set: (e) => {
            ; (t = e),
                a.forEach((e) => {
                    e(o, t)
                }),
                n()
        },
        get: () => t,
        get verbose() {
            return (o.debug || (() => { })).bind(console)
        },
        debug: () => { },
        log: () => { },
        warn: () => { },
        info: () => { },
        error: () => { },
        addChangeListener: (e) => {
            a.push(e)
        }
    }
    n()
    const {
        atob,
        btoa,
        clearTimeout,
        setTimeout,
        localStorage
    } = self
    const C = "chromeStorage"
    const D = "version"
    const x = "schema"
    const J = "config"
    const W = "session"
    const T = (() => {
        const e = [D]
        const t = {}
        return (
            e.forEach((e) => {
                t[e] = !0
            }),
            {
                keys: e,
                has: function (e) {
                    return !!t[e]
                },
            }
        )
    })()
    const { storage: R, runtime: z } = chrome
    const U = async function (e, t) {
        const a = F[e][t]
        a && (await a())
    }
    let q
    const F = {
        chromeStorage: (() => {
            let e = !1,
                t = {}
            const a = "normal"
            const n = {
                setValue: async (e, n) => {
                    const o = e
                    t[o] = n
                    const s = {}
                        ; (s[o] = { origin: a, value: n }),
                            await new Promise((e) => R.local.set(s, () => e()))
                },
                setValues: async (e) => {
                    const n = {}
                    Object.keys(e).forEach((o) => {
                        const s = o,
                            r = e[o]
                            ; (t[s] = r), (n[s] = { origin: a, value: r })
                    }),
                        await new Promise((e) => R.local.set(n, () => e()))
                },
                getValue: (e, a) => {
                    const n = e
                    return void 0 === t[n] ? a : t[n]
                },
                deleteAll: async () => {
                    const e = ((e, t) => {
                        const a = {}
                        for (const n of t) {
                            const t = e.getValue(n)
                            void 0 !== t && (a[n] = t)
                        }
                        return a
                    })(n, T.keys)
                        ; (t = e),
                            await new Promise((t) => {
                                R.local.clear(async () => {
                                    await (async (e, t) => {
                                        await Promise.all(
                                            Object.getOwnPropertyNames(t).map(async (a) => {
                                                void 0 !== t[a] && (await e.setValue(a, t[a]))
                                            })
                                        )
                                    })(n, e),
                                        t()
                                })
                            })
                },
                deleteValue: async (e) => {
                    const a = e
                    delete t[a],
                        await new Promise((e) => R.local.remove(a, () => e()))
                },
                listValues: () => {
                    const e = []
                    return (
                        Object.getOwnPropertyNames(t).forEach((t) => {
                            e.push(t)
                        }),
                        e
                    )
                },
                isWorking: async () =>
                    new Promise((e, t) => {
                        let a = 0
                        const n = Date.now(),
                            s = "foo",
                            r = {}
                        r[s] = { origin: "normal", value: n }
                        const i = () => {
                            d && clearTimeout(d), (d = null)
                        },
                            l = (e) => {
                                ++a <= 5
                                    ? (o.warn(
                                        "storage:",
                                        e || "storage set/get test failed!"
                                    ),
                                        setTimeout(u, a * a * 100))
                                    : (o.warn(
                                        "storage: storage set/get test finally failed!"
                                    ),
                                        c())
                            },
                            c = () => {
                                d && (i(), t())
                            }
                        let d = setTimeout(() => {
                            ; (d = null), c()
                        }, 18e4)
                        const u = () => {
                            o.log("Storage: test -> start")
                            const t = Date.now()
                            R.local.set(r, () => {
                                o.log(
                                    "Storage: test -> set after " + (Date.now() - t) + "ms"
                                ),
                                    R.local.get(
                                        s,
                                        (a) => (
                                            o.log(
                                                "Storage: test -> get after " +
                                                (Date.now() - t) +
                                                "ms"
                                            ),
                                            a && a[s]
                                                ? a[s].value !== n
                                                    ? l(
                                                        "read value is different " +
                                                        JSON.stringify(a[s]) +
                                                        " != " +
                                                        JSON.stringify(n)
                                                    )
                                                    : z.lastError
                                                        ? l(
                                                            (z.lastError && z.lastError.message) ||
                                                            "lastError is set"
                                                        )
                                                        : void R.local.remove(s, () => {
                                                            o.log(
                                                                "Storage: test -> remove after " +
                                                                (Date.now() - t) +
                                                                "ms"
                                                            ),
                                                                d && (i(), e())
                                                        })
                                                : l("read value is" + JSON.stringify(a))
                                        )
                                    )
                            })
                        }
                        u()
                    }),
            }
            return {
                init: async () => {
                    if (!e) {
                        e = !0
                        const a = (e) => {
                            ; (t = {}),
                                e &&
                                Object.keys(e).forEach((a) => {
                                    const n = e[a]
                                    n &&
                                        n.hasOwnProperty("origin") &&
                                        n.hasOwnProperty("value")
                                        ? (t[a] = n.value)
                                        : (t[a] = n)
                                })
                        }
                        await new Promise((e) =>
                            R.local.get(null, (t) => {
                                a(t), e()
                            })
                        )
                    }
                },
                clean: async () => {
                    ; (e = !1), (t = {})
                },
                options: {},
                methods: n,
            }
        })(),
    }
    const $ = async () =>
        q
            ? (q.isWorking || Promise.resolve)()
            : new Promise((e, t) => {
                setTimeout(async () => {
                    try {
                        await $(), e()
                    } catch (e) {
                        t()
                    }
                }, 1e3)
            })
    const H = {
        secure: {},
        setValue: (e, t) => q.setValue(e, t),
        setValues: (e) => q.setValues(e),
        getValue: (e, t) => q.getValue(e, t),
        deleteAll: () => q.deleteAll(),
        deleteValue: (e) => q.deleteValue(e),
        listValues: () => q.listValues(),
        isWorking: $,
        migrate: async (e, t, a) => {
            const n = F[e],
                s = F[t],
                r = a || {}
            if (!n || !s) {
                const a = "Migration: unknown storage implementation(s) "
                throw (o.error(a, e, t), a)
            }
            await U(e, "init"),
                await U(t, "init"),
                await Promise.all(
                    n.methods.listValues().map(async (e) => {
                        const t = n.methods.getValue(e)
                        r.drop && (await n.methods.deleteValue(e)),
                            void 0 !== t && (await s.methods.setValue(e, t))
                    })
                ),
                await U(t, "clean"),
                await U(e, "clean")
        },
        init: async () => {
            o.debug("Storage: use " + C)
            const e = F[C]
                ; (q = e.methods), e.init && (await e.init())
        },
        factoryReset: () => H.deleteAll(),
        isWiped: async () => !1,
        setVersion: async (e, t) => {
            await H.setValue(D, e), t && (await H.setValue(x, t))
        },
        getVersion: async (e) => (await H.getValue(D)) || e,
        getSchemaVersion: () => H.getValue(x, "1.0"),
    }
    const X = H
    const B = chrome.runtime.id.substr(0, 4)
    const G = [
        "dhdgffkkebhmkfjojejmpbldmpobfkfo",
        "gcalenpjmijncebpfijmoaglllgpjagf",
        "iikmkjmpaadaobahmlepeloendndfphd",
        "fcmfnpggmnlmfebfghbfnillijihnkoh",
        "heiflgcdlcilkmbminjohdnmejohiblb",
    ]
    const K = []
    const Y = {}
    const Z = {}
    const _ = {
        configMode: 0,
        logLevel: "hohm" === B ? 100 : 0,
        externalExtensionIds: [...G],
    }
    const ee = {}
    const te = (e) => {
        let t,
            a = X.getValue(J, {})
        return (
            a instanceof Object || (a = {}),
            void 0 !== (t = a[e]) ? t : "function" == typeof (t = _[e]) ? t() : t
        )
    }
    const ae = (e, t) => {
        let a = X.getValue(J, {})
        a instanceof Object || (a = {})
        const n = te(e)
        a[e] = t
        const s = X.setValue(J, a),
            r = Z[e]
        return (
            r &&
            JSON.stringify(n) != JSON.stringify(t) &&
            r.forEach((a) => {
                try {
                    a(e, n, t, s)
                } catch (e) {
                    o.warn("config: changeListener error", e)
                }
            }),
            s
        )
    }
    let ne = {}
        ; (() => {
            let e
            if (localStorage && (e = localStorage.getItem(W)))
                try {
                    ne = JSON.parse(atob(e))
                } catch (e) { }
        })()
    const oe = (e) => {
        let t
        return void 0 !== (t = ne[e]) ? t : ee[e]
    }
    const se = (e, t) => {
        const a = oe(e)
        void 0 === t ? delete ne[e] : (ne[e] = t),
            localStorage &&
            localStorage.setItem(
                W,
                ((e) => {
                    let t = ""
                    for (let a = 0;a < e.length;a++)
                        t += String.fromCharCode(255 & e.charCodeAt(a))
                    return btoa(t)
                })(JSON.stringify(ne))
            )
        const n = Z[e]
        n &&
            JSON.stringify(a) != JSON.stringify(t) &&
            n.forEach((n) => {
                try {
                    n(e, a, t)
                } catch (e) {
                    o.warn("config: changeListener error", e)
                }
            })
    }
    const re = {
        initialized: !1,
        values: {},
        snapshot: {},
        init: async () => {
            const e = {}
            Object.defineProperty(re, "snapshot", {
                get: function () {
                    return { ...re.values }
                },
                enumerable: !0,
            }),
                Object.keys(_).forEach((t) => {
                    Object.defineProperty(e, t, {
                        get: function () {
                            return te(t)
                        },
                        set: function (e) {
                            ae(t, e)
                        },
                        enumerable: !0,
                    })
                }),
                Object.keys(ee).forEach((t) => {
                    Object.defineProperty(e, t, {
                        get: function () {
                            return oe(t)
                        },
                        set: function (e) {
                            se(t, e)
                        },
                        enumerable: !0,
                    })
                }),
                (re.values = e),
                (re.initialized = !0)
        },
        getValue: (e) => (ee.hasOwnProperty(e) ? oe(e) : te(e)),
        setValue: async (e, t) =>
            ee.hasOwnProperty(e) ? await se(e, t) : await ae(e, t),
        getDefaults: () => _,
        addChangeListener: (e, t) => {
            var a
                ; ((a = e), Array.isArray(a) ? a : [a]).forEach((e) => {
                    let a = Z[e]
                    a || (a = Z[e] = []), a.push(t)
                })
        },
    }
    const le = "https://vscode.dev/?connectTo=tc"
    const {
        runtime,
        action,
        tabs,
        webNavigation,
        scripting,
    } = chrome
        ; (async (e) => {
            ; (e.oninstall = () => e.skipWaiting()),
                webNavigation.onCommitted.addListener((e) => {
                    console.log(e)
                    const { url: t, tabId: a } = e
                    t.startsWith(le) &&
                        (scripting.executeScript({
                            files: ["content.js"],
                            target: { tabId: a, frameIds: [0] },
                            injectImmediately: !0,
                            world: "ISOLATED",
                        }),
                            scripting.executeScript({
                                files: ["page.js"],
                                target: { tabId: a, frameIds: [0] },
                                injectImmediately: !0,
                                world: "MAIN",
                            }))
                })
            const t = async (e, n) => {
                if (a) return await a, t(e, n)
                {
                    let t = () => null
                        ; (a = new Promise((e) => (t = e))), a.then(() => (a = void 0))
                    const s = await (async (e) => {
                        const t =
                            K.length && K.includes(B) ? re.values.externalExtensionIds : G
                        return (
                            await Promise.all(
                                t.map((t) => {
                                    if (void 0 === Y[t])
                                        return (
                                            (Y[t] = !1),
                                            new Promise((a) => {
                                                try {
                                                    const n = runtime.connect(t),
                                                        o = Math.random().toString(36).substr(2, 5)
                                                    n.postMessage({
                                                        method: "userscripts",
                                                        action: "options",
                                                        messageId: o,
                                                        activeUrls: e,
                                                    }),
                                                        n.onMessage.addListener((e) => {
                                                            runtime.lastError,
                                                                e || (delete Y[t], n.disconnect()),
                                                                e &&
                                                                e.messageId === o &&
                                                                e.allow &&
                                                                e.allow.includes("list") &&
                                                                (Y[t] = n),
                                                                a()
                                                        }),
                                                        n.onDisconnect.addListener(() => {
                                                            runtime.lastError, delete Y[t], a()
                                                        })
                                                } catch (e) {
                                                    o.debug(`unable to talk to ${t}`, e), a()
                                                }
                                            })
                                        )
                                })
                            ),
                            Object.keys(Y)
                                .filter((e) => !1 !== Y[e])
                                .map((e) => ({ id: e, port: Y[e] }))
                        )
                    })([le])
                    if (!s.length) return n({ error: "no extension to talk to" }), void t()
                    const [{ id: r, port: i }] = s
                    o.log(`Found extension ${r}`)
                    const l = (e) => {
                        n(e), i.onMessage.removeListener(l), t()
                    }
                    i.onMessage.addListener(l),
                        i.postMessage({
                            method: e.method,
                            ...e.args,
                        }),
                        await a,
                        (a = void 0)
                }
            }
            runtime.onMessage.addListener((e, a, n) => (t(e, n), !0)),
                action.onClicked.addListener(() => {
                    runtime.lastError,
                        tabs.query({ url: le + "*" }, (e) => {
                            e && e.length && e[0].id
                                ? tabs.update(e[0].id, { active: !0 }, () => runtime.lastError)
                                : tabs.create({ url: le, active: !0 }, () => runtime.lastError)
                        })
                })
            let a = (async () => {
                await X.init(), await re.init(), o.set(re.values.logLevel)
            })()
            await a, (a = void 0), o.log("Tampermonkey Editors initialization done")
        })(self)
})()