const { runtime, action, tabs, webNavigation, scripting } = chrome
const urlWhiteList = ["https://vscode.dev", "http://127.0.0.1:5173"]
const isInWhiteList = (url: string) =>
	urlWhiteList.some((whiteUrl) => url.indexOf(whiteUrl) > -1)

webNavigation.onCompleted.addListener(
	(e: chrome.webNavigation.WebNavigationFramedCallbackDetails) => {
		const { url, tabId } = e
		console.log(url, tabId)
		// if (isInWhiteList(url)) {
		// 	return
		// }
		scripting.executeScript({
			files: ["page.js"],
			target: {
				tabId,
				frameIds: [0],
			},
			injectImmediately: true,
			world: "MAIN",
		})
		scripting.executeScript({
			files: ["content.js"],
			target: {
				tabId,
				frameIds: [0],
			},
			injectImmediately: true,
			world: "ISOLATED",
		})
		scripting.insertCSS({
			files: ["content.css"],
			target: {
				tabId,
				frameIds: [0],
			}
		})
	}
)

const port = runtime.connect()

port.onMessage.addListener((message) => {
	console.log(message)
})

runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log(message, sender)
    sendResponse("收到")
	return true
})