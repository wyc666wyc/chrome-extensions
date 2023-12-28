
const { runtime } = chrome
const handler = (event: MessageEvent) => {
    const { data } = event
    console.log(data)
    if (data.type !== 'setContent') return
    runtime.sendMessage(data, () => {
        console.log("send message发送成功")
    })
    window.open("https://vscode.dev/?connectTo=tc")
}
export const listener = {
    start: () => {
        window.addEventListener("message", handler)
    },
    remove: () => {
        window.removeEventListener("message", handler)
    }
}

export const handleOpenEditor = () => {
	window.postMessage({ type: 'getContent' }, '*')
}
