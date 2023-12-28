import { FileGS } from './file'

const a = () => {
    console.log('a')
    setInterval(() => {
        window.postMessage({a: 1}, '*')
    }, 30000)
}
a()