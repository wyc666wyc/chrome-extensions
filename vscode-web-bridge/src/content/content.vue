<template>
	<div>
		<div
			@click="handleOpenEditor"
			draggable="true"
			@dragstart="handleDragstart($event)"
			@drageover="handleDragover($event)"
			@dragend="handleDragend($event)"
			class="ball"
			:style="ballStyle"
		>
			<img src="../../public/images/vscode.png" alt="">
		</div>
	</div>
</template>
<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive } from "vue"
import { listener } from './channel'

const ballStatus = reactive({
	startClientX: 0,
	startClientY: 0,
	right: 10,
	bottom: 10,
})
const ballStyle = computed(() => {
	return {
		// transform: `translate(${ballStatus.right}px, ${ballStatus.bottom}px)`,
		right: `${ballStatus.right}px`,
		bottom: `${ballStatus.bottom}px`,
	}
})
const handleOpenEditor = () => {
	window.open("https://vscode.dev/?connectTo=tc")
}
const handleDragstart = (e: any) => {
	ballStatus.startClientX = e.clientX
	ballStatus.startClientY = e.clientY
}
const handleDragover = (e: any) => {
	e.stopPropagation()
	e.preventDefault()
	e.dataTransfer.effectAllowed = 'move'
}
const handleDragend = (e: any) => {
	const { clientX, clientY } = e
	const { startClientX, startClientY } = ballStatus
	const x = startClientX - clientX
	const y = startClientY - clientY
	ballStatus.right += x
	ballStatus.bottom += y
}

onMounted(() => {
	listener.start()
})
onUnmounted(() => {
	listener.remove()
})
</script>
<style lang="scss">
.ball {
	position: fixed;
	width: 45px;
	height: 45px;
    padding: 7px;
	border-radius: 50%;
	color: #fff;
    background-color: aliceblue;
	filter: drop-shadow(0 0 2px rgb(113, 179, 255));
	cursor: pointer;
	img {
		width: 100%;
		height: 100%;
	}
}
</style>
