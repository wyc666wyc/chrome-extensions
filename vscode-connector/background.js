; (() => {
    "use strict"
    const {
        storage,
        runtime,
        action,
        tabs,
        webNavigation,
        scripting,
    } = chrome
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
    const CHROME_STORAGE = "chromeStorage"
    const VERSION = "version"
    const SCHEMA = "schema"
    const CONFIG = "config"
    const SESSION = "session"
    const T = (() => {
        const e = [VERSION]
        const t = {}
        return (
            e.forEach((e) => {
                t[e] = true
            }),
            {
                keys: e,
                has: function (e) {
                    return !!t[e]
                },
            }
        )
    })()
    const U = async function (e, t) {
        const a = Storage[e][t]
        a && (await a())
    }
    let q
    const Storage = {
        chromeStorage: (() => {
            let isInited = false
            let tMap = {}
            const origin = "normal"
            const methods = {
                setValue: async (key, value) => {
                    tMap[key] = value
                    const target = {}
                    target[key] = { origin, value }
                    await new Promise((e) => storage.local.set(target, () => e()))
                },
                setValues: async (obj) => {
                    const target = {}
                    Object.keys(obj).forEach((key) => {
                        const value = obj[key]
                        tMap[key] = value
                        target[key] = { origin, value }
                    })
                    await new Promise((e) => storage.local.set(target, () => e()))
                },
                getValue: (key, value) => tMap[key] || value,
                deleteAll: async () => {
                    const e = ((e, t) => {
                        const a = {}
                        for (const n of t) {
                            const t = e.getValue(n)
                            void 0 !== t && (a[n] = t)
                        }
                        return a
                    })(methods, T.keys)
                        ; (tMap = e),
                            await new Promise((t) => {
                                storage.local.clear(async () => {
                                    await (async (e, t) => {
                                        await Promise.all(
                                            Object.getOwnPropertyNames(t).map(async (a) => {
                                                void 0 !== t[a] && (await e.setValue(a, t[a]))
                                            })
                                        )
                                    })(methods, e),
                                        t()
                                })
                            })
                },
                deleteValue: async (e) => {
                    const a = e
                    delete tMap[a],
                        await new Promise((e) => storage.local.remove(a, () => e()))
                },
                listValues: () => {
                    const e = []
                    return (
                        Object.getOwnPropertyNames(tMap).forEach((t) => {
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
                            storage.local.set(r, () => {
                                o.log(
                                    "Storage: test -> set after " + (Date.now() - t) + "ms"
                                ),
                                    storage.local.get(
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
                                                    : runtime.lastError
                                                        ? l(
                                                            (runtime.lastError && runtime.lastError.message) ||
                                                            "lastError is set"
                                                        )
                                                        : void storage.local.remove(s, () => {
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
                    if (!isInited) {
                        isInited = true
                        const a = (e) => {
                            ; (t = {}),
                                e &&
                                Object.keys(e).forEach((a) => {
                                    const n = e[a]
                                    n &&
                                        n.hasOwnProperty("origin") &&
                                        n.hasOwnProperty("value")
                                        ? (tMap[a] = n.value)
                                        : (tMap[a] = n)
                                })
                        }
                        await new Promise((e) =>
                            storage.local.get(null, (t) => {
                                a(t), e()
                            })
                        )
                    }
                },
                clean: async () => {
                    isInited = false
                    tMap = {}
                },
                options: {},
                methods,
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
    const storageFactory = {
        secure: {},
        setValue: (e, t) => q.setValue(e, t),
        setValues: (e) => q.setValues(e),
        getValue: (e, t) => q.getValue(e, t),
        deleteAll: () => q.deleteAll(),
        deleteValue: (e) => q.deleteValue(e),
        listValues: () => q.listValues(),
        isWorking: $,
        migrate: async (e, t, a) => {
            const n = Storage[e],
                s = Storage[t],
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
            o.debug("Storage: use " + CHROME_STORAGE)
            const e = Storage[CHROME_STORAGE]
            q = e.methods
            e.init && (await e.init())
        },
        factoryReset: () => storageFactory.deleteAll(),
        isWiped: async () => false,
        setVersion: async (e, t) => {
            await storageFactory.setValue(VERSION, e), t && (await storageFactory.setValue(SCHEMA, t))
        },
        getVersion: async (e) => (await storageFactory.getValue(VERSION)) || e,
        getSchemaVersion: () => storageFactory.getValue(SCHEMA, "1.0"),
    }
    const runtimeId = chrome.runtime.id.substr(0, 4)
    const externalExtensionIds = [
        "dhdgffkkebhmkfjojejmpbldmpobfkfo",
        "gcalenpjmijncebpfijmoaglllgpjagf",
        "iikmkjmpaadaobahmlepeloendndfphd",
        "fcmfnpggmnlmfebfghbfnillijihnkoh",
        "heiflgcdlcilkmbminjohdnmejohiblb",
    ]
    const K = []
    const Y = {}
    const Z = {}
    const config = {
        configMode: 0,
        logLevel: "hohm" === runtimeId ? 100 : 0,
        externalExtensionIds: [...externalExtensionIds],
    }
    const listenerObj = {}
    const getValueFn = (e) => {
        let t,
            a = storageFactory.getValue(CONFIG, {})
        return (
            a instanceof Object || (a = {}),
            void 0 !== (t = a[e]) ? t : "function" == typeof (t = config[e]) ? t() : t
        )
    }
    const ae = (e, t) => {
        let a = storageFactory.getValue(CONFIG, {})
        a instanceof Object || (a = {})
        const n = getValueFn(e)
        a[e] = t
        const s = storageFactory.setValue(CONFIG, a),
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
    let localStorageData = {}
    try {
        const value = localStorage.getItem(SESSION)
        localStorageData = JSON.parse(atob(value))
    } catch (e) { }
    const getListener = (e) => localStorageData[e] || listenerObj[e]
    const se = (e, t) => {
        const listener = getListener(e)
        void 0 === t ? delete localStorageData[e] : (localStorageData[e] = t),
            localStorage &&
            localStorage.setItem(
                SESSION,
                ((e) => {
                    let t = ""
                    for (let a = 0;a < e.length;a++)
                        t += String.fromCharCode(255 & e.charCodeAt(a))
                    return btoa(t)
                })(JSON.stringify(localStorageData))
            )
        const n = Z[e]
        n &&
            JSON.stringify(listener) != JSON.stringify(t) &&
            n.forEach((n) => {
                try {
                    n(e, listener, t)
                } catch (e) {
                    o.warn("config: changeListener error", e)
                }
            })
    }
    const listenerFactory = {
        initialized: false,
        values: {},
        snapshot: {},
        init: async () => {
            const e = {}
            Object.defineProperty(listenerFactory, "snapshot", {
                get: function () {
                    return { ...listenerFactory.values }
                },
                enumerable: true,
            })
            Object.keys(config).forEach((t) => {
                Object.defineProperty(e, t, {
                    get: function () {
                        return getValueFn(t)
                    },
                    set: function (e) {
                        ae(t, e)
                    },
                    enumerable: true,
                })
            })
            Object.keys(listenerObj).forEach((t) => {
                Object.defineProperty(e, t, {
                    get: function () {
                        return getListener(t)
                    },
                    set: function (e) {
                        se(t, e)
                    },
                    enumerable: true,
                })
            })
            listenerFactory.values = e
            listenerFactory.initialized = true
        },
        getValue: (e) => (listenerObj.hasOwnProperty(e) ? getListener(e) : getValueFn(e)),
        setValue: async (e, t) =>
            listenerObj.hasOwnProperty(e) ? await se(e, t) : await ae(e, t),
        getDefaults: () => config,
        addChangeListener: (e, t) => {
            var a
                ; ((a = e), Array.isArray(a) ? a : [a]).forEach((e) => {
                    let a = Z[e]
                    a || (a = Z[e] = []), a.push(t)
                })
        },
    }
    const editorUrl = "https://vscode.dev/?connectTo=";
    (async (e) => {
        (e.oninstall = () => e.skipWaiting())
        webNavigation.onCommitted.addListener((e) => {
            const { url, tabId: a } = e
            // if (url.startsWith(editorUrl)) {
            //     return
            // }
            scripting.executeScript({
                files: ["content.js"],
                target: { tabId: a, frameIds: [0] },
                injectImmediately: true,
                world: "ISOLATED",
            })
            scripting.executeScript({
                files: ["page.js"],
                target: { tabId: a, frameIds: [0] },
                injectImmediately: true,
                world: "MAIN",
            })
        })
        const t = async (e, n) => {
            if (a) return await a, t(e, n)
            {
                let t = () => null
                a = new Promise((e) => (t = e))
                a.then(() => (a = void 0))
                const s = await (async (activeUrls) => {
                    const list =
                        K.length && K.includes(runtimeId) ? listenerFactory.values.externalExtensionIds : externalExtensionIds
                    return (
                        await Promise.all(
                            list.map((key) => {
                                if (void 0 === Y[key])
                                    return (
                                        (Y[key] = false),
                                        new Promise((a) => {
                                            try {
                                                const n = runtime.connect(key)
                                                const o = Math.random().toString(36).substr(2, 5)
                                                n.postMessage({
                                                    method: "userscripts",
                                                    action: "options",
                                                    messageId: o,
                                                    activeUrls,
                                                })
                                                n.onMessage.addListener((e) => {
                                                    runtime.lastError,
                                                        e || (delete Y[key], n.disconnect()),
                                                        e &&
                                                        e.messageId === o &&
                                                        e.allow &&
                                                        e.allow.includes("list") &&
                                                        (Y[key] = n),
                                                        a()
                                                })
                                                n.onDisconnect.addListener(() => {
                                                    runtime.lastError, delete Y[key], a()
                                                })
                                            } catch (e) {
                                                o.debug(`unable to talk to ${key}`, e), a()
                                            }
                                        })
                                    )
                            })
                        ),
                        Object.keys(Y)
                            .filter((e) => false !== Y[e])
                            .map((e) => ({ id: e, port: Y[e] }))
                    )
                })([editorUrl])
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
        runtime.onMessage.addListener((e, a, n) => (t(e, n), true))
        action.onClicked.addListener(() => {
            console.log('action.onClicked')
            runtime.lastError,
                tabs.query({ url: editorUrl + "*" }, (e) => {
                    e && e.length && e[0].id
                        ? tabs.update(e[0].id, { active: true }, () => runtime.lastError)
                        : tabs.create({ url: editorUrl, active: true }, () => runtime.lastError)
                })
        })
        let a = (async () => {
            await storageFactory.init()
            await listenerFactory.init()
            o.set(listenerFactory.values.logLevel)
        })()
        await a
        a = void 0
        o.log("Tampermonkey Editors initialization done")
    })(self)
})()
