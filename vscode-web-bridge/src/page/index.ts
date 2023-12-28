import { FileGS } from "./file"

const monacoInstance = (window as any).alleMonacoEditor

window.addEventListener("message", (event) => {
	const { data } = event
	if (data.type === "getContent") {
		window.postMessage(
			{
				type: "setContent",
				content: monacoInstance.getValue(),
			},
			"*"
		)
	}
})
