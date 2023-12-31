; (() => {
    "use strict"
    let tempText = null
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
    let tCount = 0
    const changeListener = []
    const bindConsole = () => {
        const e = ["debug"],
            a = ["log"],
            n = ["warn", "info"],
            s = ["error"],
            r = [...e, ...a, ...n, ...s],
            i = s
        tCount >= 80 && i.push(...e),
            tCount >= 60 && i.push(...a),
            tCount >= 30 && i.push(...n),
            r.forEach(
                (e) => (verbose[e] = i.includes(e) ? console[e].bind(console) : () => { })
            )
    }
    const verbose = {
        set: (e) => {
            tCount = e
            changeListener.forEach((e) => {
                e(verbose, tCount)
            })
            bindConsole()
        },
        get: () => tCount,
        get verbose() {
            return (verbose.debug || (() => { })).bind(console)
        },
        debug: () => { },
        log: () => { },
        warn: () => { },
        info: () => { },
        error: () => { },
        addChangeListener: (e) => {
            changeListener.push(e)
        }
    }
    bindConsole()
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
    const createVersionObject = (() => {
        const e = [VERSION]
        const t = e.reduce((obj, key) => {
            obj[key] = true
            return obj
        }, {})
        return {
            keys: e,
            has: function (key) {
                return !!t[key]
            }
        }
    })()
    const execStorageMethod = async function (e, t) {
        const a = Storage[e][t]
        a && (await a())
    }
    let storageMethods
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
                    })(methods, createVersionObject.keys)
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
                                    ? (verbose.warn(
                                        "storage:",
                                        e || "storage set/get test failed!"
                                    ),
                                        setTimeout(u, a * a * 100))
                                    : (verbose.warn(
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
                            verbose.log("Storage: test -> start")
                            const t = Date.now()
                            storage.local.set(r, () => {
                                verbose.log(
                                    "Storage: test -> set after " + (Date.now() - t) + "ms"
                                ),
                                    storage.local.get(
                                        s,
                                        (a) => (
                                            verbose.log(
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
                                                            verbose.log(
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
                            ; (tMap = {}),
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
    const isWorking = async () =>
        storageMethods
            ? (storageMethods.isWorking || Promise.resolve)()
            : new Promise((e, t) => {
                setTimeout(async () => {
                    try {
                        await isWorking(), e()
                    } catch (e) {
                        t()
                    }
                }, 1e3)
            })
    const storageFactory = {
        secure: {},
        setValue: (e, t) => storageMethods.setValue(e, t),
        setValues: (e) => storageMethods.setValues(e),
        getValue: (e, t) => storageMethods.getValue(e, t),
        deleteAll: () => storageMethods.deleteAll(),
        deleteValue: (e) => storageMethods.deleteValue(e),
        listValues: () => storageMethods.listValues(),
        isWorking,
        migrate: async (e, t, a) => {
            const n = Storage[e],
                s = Storage[t],
                r = a || {}
            if (!n || !s) {
                const a = "Migration: unknown storage implementation(s) "
                throw (verbose.error(a, e, t), a)
            }
            await execStorageMethod(e, "init")
            await execStorageMethod(t, "init")
            await Promise.all(
                n.methods.listValues().map(async (e) => {
                    const t = n.methods.getValue(e)
                    r.drop && (await n.methods.deleteValue(e)),
                        void 0 !== t && (await s.methods.setValue(e, t))
                })
            )
            await execStorageMethod(t, "clean")
            await execStorageMethod(e, "clean")
        },
        init: async () => {
            verbose.debug("Storage: use " + CHROME_STORAGE)
            const e = Storage[CHROME_STORAGE]
            storageMethods = e.methods
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
    const portObj = {}
    const Z = {}
    const config = {
        configMode: 0,
        logLevel: "hohm" === runtimeId ? 100 : 0,
        externalExtensionIds: [...externalExtensionIds],
    }
    const listenerObj = {}
    const getConfig = (key) => {
        let t
        let storageData = storageFactory.getValue(CONFIG, {})
        return (
            storageData instanceof Object || (storageData = {}),
            void 0 !== (t = storageData[key]) ? t : "function" == typeof (t = config[key]) ? t() : t
        )
    }
    const setConfig = (key, value) => {
        let storageData = storageFactory.getValue(CONFIG, {});
        if (typeof storageData !== 'object') {
            storageData = {};
        }
        if (!(storageConfig instanceof Object)) {
            storageData = {};
        }
        const oldValue = getConfig(key);
        storageData[key] = value;
        const saveResult = storageFactory.setValue(CONFIG, storageData);
        const listeners = Z[key];
        if (listeners && JSON.stringify(oldValue) !== JSON.stringify(value)) {
            listeners.forEach(listener => {
                try {
                    listener(key, oldValue, value, saveResult);
                } catch (error) {
                    verbose.warn('config: changeListener error', error);
                }
            });
        }
        return saveResult;
    }
    let localStorageData = {}
    try {
        const value = localStorage.getItem(SESSION)
        localStorageData = JSON.parse(atob(value))
    } catch (e) { }
    const getListener = (e) => localStorageData[e] || listenerObj[e]
    const setListener = (e, t) => {
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
                    verbose.warn("config: changeListener error", e)
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
                        return getConfig(t)
                    },
                    set: function (e) {
                        setConfig(t, e)
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
                        setListener(t, e)
                    },
                    enumerable: true,
                })
            })
            listenerFactory.values = e
            listenerFactory.initialized = true
        },
        getValue: (e) => (listenerObj.hasOwnProperty(e) ? getListener(e) : getConfig(e)),
        setValue: async (e, t) =>
            listenerObj.hasOwnProperty(e) ? await setListener(e, t) : await setConfig(e, t),
        getDefaults: () => config,
        addChangeListener: (e, t) => {
            var a
                ; ((a = e), Array.isArray(a) ? a : [a]).forEach((e) => {
                    let a = Z[e]
                    a || (a = Z[e] = []), a.push(t)
                })
        },
    }
    const wait = (delay = 1000) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve()
            }, delay)
        })
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
                files: ["birdge.js"],
                target: { tabId: a, frameIds: [0] },
                injectImmediately: true,
                world: "ISOLATED",
            })
            if (url.indexOf('vscode.dev') > -1) {
                scripting.executeScript({
                    files: ["page.js"],
                    target: { tabId: a, frameIds: [0] },
                    injectImmediately: true,
                    world: "MAIN",
                })
            } else {
                scripting.executeScript({
                    files: ["page2.js"],
                    target: { tabId: a, frameIds: [0] },
                    injectImmediately: true,
                    world: "MAIN",
                })
            }
        })

        const createMessageChannel = async (message, sendResponse) => {
            if (setup) {
                await setup
                return createMessageChannel(message, sendResponse)
            }
            let promiseFn = () => null
            setup = new Promise((e) => (promiseFn = e))
            setup.then(() => (setup = void 0))
            const getExtensions = async (activeUrls) => {
                const list = K.length && K.includes(runtimeId) ? listenerFactory.values.externalExtensionIds : externalExtensionIds
                await Promise.all(
                    list.map((key) => {
                        if (portObj[key] === void 0) {
                            portObj[key] = false
                            return new Promise((resolve) => {
                                try {
                                    const port = runtime.connect(key)
                                    const messageId = Math.random().toString(36).substr(2, 5)
                                    port.postMessage({
                                        method: "userscripts",
                                        action: "options",
                                        messageId,
                                        activeUrls,
                                    })
                                    port.onMessage.addListener((e) => {
                                        runtime.lastError,
                                            e || (delete portObj[key], port.disconnect()),
                                            e &&
                                            e.messageId === messageId &&
                                            e.allow &&
                                            e.allow.includes("list") &&
                                            (portObj[key] = port),
                                            resolve()
                                    })
                                    port.onDisconnect.addListener(() => {
                                        runtime.lastError, delete portObj[key], resolve()
                                    })
                                } catch (e) {
                                    verbose.debug(`unable to talk to ${key}`, e), resolve()
                                }
                            })
                        }
                    })
                )
                return Object.keys(portObj)
                    .filter((key) => portObj[key] !== false)
                    .map((key) => ({ id: key, port: portObj[key] }))
            }
            const extensions = await getExtensions([editorUrl])
            if (!extensions.length) return sendResponse({ error: "no extension to talk to" }), void promiseFn()
            const [{ id, port }] = extensions
            verbose.log(`Found extension ${id}`)
            const listenerFn = (e) => {
                sendResponse(e)
                port.onMessage.removeListener(listenerFn)
                promiseFn()
            }
            port.onMessage.addListener(listenerFn)
            port.postMessage({
                method: message.method,
                ...message.args,
            })
            await setup
            setup = void 0
        }

        const createAlleMessageChannel = async (message, sendResponse) => {
            let result
            const { method, args } = message
            const { action } = args
            if (action === 'list') {
                result = {
                    list: [
                        {
                            "namespace": "万象编辑器",
                            "name": "script",
                            "path": "6b954ad4-6aa1-445d-99b9-16bc42378f3c/source",
                            "requires": []
                        }
                    ]
                }
            }
            if (action === 'get') {
                const getTargetTab = (condition) => {
                    return new Promise((resolve) => {
                        tabs.query({}, (tabList) => {
                            const t = tabList.find(condition)
                            resolve(t)
                        })
                    })
                }
                const targetTab = await getTargetTab((tab) => tab.url.indexOf('tcwireless.t.17usoft') > -1)
                let response = await tabs.sendMessage(targetTab.id, {
                    messageType: 'userscripts',
                    args: {
                        method: 'get'
                    }
                })
                if (!response) {
                    await wait(200)
                    response = await tabs.sendMessage(targetTab.id, {
                        messageType: 'userscripts',
                        args: {
                            method: 'get'
                        }
                    })
                }
                result = response
            }
            sendResponse(result)
        }
        runtime.onMessage.addListener((message, sender, sendResponse) => {
            // createMessageChannel(message, sendResponse)
            createAlleMessageChannel(message, sendResponse)
            return true
        })
        action.onClicked.addListener(() => {
            runtime.lastError,
                tabs.query({ url: editorUrl + "*" }, (e) => {
                    e && e.length && e[0].id
                        ? tabs.update(e[0].id, { active: true }, () => runtime.lastError)
                        : tabs.create({ url: editorUrl, active: true }, () => runtime.lastError)
                })
        })
        let setup = (async () => {
            await storageFactory.init()
            await listenerFactory.init()
            verbose.set(listenerFactory.values.logLevel)
        })()
        await setup
        setup = void 0
        verbose.log("vscode-connector initialization done")
    })(self)
})()
