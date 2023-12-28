
const { runtime } = chrome
const handler = (event: MessageEvent) => {
    const { data } = event
    runtime.sendMessage(data, () => {
        console.log("send message发送成功")
    })
    console.log(data)
}
export const listener = {
    start: () => {
        window.addEventListener("message", handler)
    },
    remove: () => {
        window.removeEventListener("message", handler)
    }
}