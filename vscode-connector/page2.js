const startWork = async (self) => {
    self.addEventListener('message', ({ data }) => {
        const { method } = data
        if (method === 'get') {
            const value = self.alleMonacoEditor.getValue()
            window.postMessage({
                method: 'getValue',
                value,
                lastModified: Date.now()
            })
        }
    })
}

let targetWindow
const monacoSensor = setInterval(() => {
    if (window.MonacoEnvironment) {
        targetWindow = window
    } else {
        const dom = document.querySelector('iframe[id^="mc-monaco-editor"]')
        if (dom) { // monaco 编辑器环境在iframe中
            targetWindow = dom.contentWindow
        }
    }
    if (targetWindow) {
        startWork(targetWindow)
        clearInterval(monacoSensor)
    }
}, 500)