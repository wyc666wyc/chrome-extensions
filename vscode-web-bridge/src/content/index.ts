import { createApp } from "vue"
import Content from "./content.vue"
import { CONTENT_ROOT_ID } from "../../globalConfig.js"

const crxApp = document.createElement("div")
crxApp.id = CONTENT_ROOT_ID
document.body.appendChild(crxApp)
const app = createApp(Content)
app.mount(`#${CONTENT_ROOT_ID}`)