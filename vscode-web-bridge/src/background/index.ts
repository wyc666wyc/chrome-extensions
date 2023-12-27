const { runtime, action, tabs, webNavigation, scripting } = chrome
const urlWhiteList = ["https://vscode.dev", "http://127.0.0.1:5173"]
const isInWhiteList = (url: string) => urlWhiteList.some((whiteUrl) => url.indexOf(whiteUrl) > -1)
webNavigation.onCompleted.addListener((e: chrome.webNavigation.WebNavigationFramedCallbackDetails) => {
    const { url, tabId } = e
    console.log(url, tabId)
    if (isInWhiteList(url)) {
        scripting.executeScript({
            files: ['page.js'],
            target: {
                tabId,
                frameIds: [0]
            },
            injectImmediately: true,
            world: 'MAIN'
        })
    }
})