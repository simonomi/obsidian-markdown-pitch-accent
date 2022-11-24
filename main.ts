import {App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting} from 'obsidian';

const pitchAccentRegex = /([^\r\n\t\f\v :\/]*){([HLl]+)}/gm
const tags = "p, h1, h2, h3, h4, h5, h6, ol, ul, table"

const convertFurigana = (element:Text): Node => {
	const matches = Array.from(element.textContent.matchAll(pitchAccentRegex))
	let lastNode = element
	for (const match of matches) {
		pitchPattern = match[2]
		text = match[1].substring(match[1].length - pitchPattern.length)
		
		const newNode = document.createElement("span")
		newNode.appendText(match[1].substring(0, match[1].length - pitchPattern.length))
		
		if (pitchPattern.length != text.length && pitchPattern.length !== text.length + 1) {
			newNode.appendText(text)
			const nodeToReplace = lastNode.splitText(lastNode.textContent.indexOf(match[0]))
			lastNode = nodeToReplace.splitText(match[0].length)
			nodeToReplace.replaceWith(newNode)
			continue
		}
		
		let index = 0
		let nextChar
		for (const character of text.split("")) {
			nextChar = newNode.createEl("span", {text: character})
			
			nextChar.addClass(pitchPattern[index] == "L" ? "pitch-accent-low" : "pitch-accent-high")
			
			if (index > 0 && pitchPattern[index] != pitchPattern[index - 1]) {
				nextChar.addClass("pitch-accent-change")
			}
			
			index++
		}
		
		if (nextChar != undefined) {
			if (pitchPattern[index] == "L") {
				nextChar.addClass("pitch-accent-drop")
			} else if (pitchPattern[index] == "H") {
				nextChar.addClass("pitch-accent-drop")
			}
		}
		
		const nodeToReplace = lastNode.splitText(lastNode.textContent.indexOf(match[0]))
		lastNode = nodeToReplace.splitText(match[0].length)
		nodeToReplace.replaceWith(newNode)
	}
	return element
}

export default class MyPlugin extends Plugin {
	public postprocessor: MarkdownPostProcessor = (el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
		const blockToReplace = el.querySelectorAll(tags)
		if (blockToReplace.length == 0) return
	
		function replace (node:Node) {
			const childrenToReplace: Text[] = []
			node.childNodes.forEach(child => {
				if (child.nodeType == 3) {
					// nodes of type 3 are TextElements
					childrenToReplace.push(child as Text)
				} else if (child.hasChildNodes() && child.nodeName != "CODE" && child.nodeName != "RUBY") {
					// ignore content in Code Blocks
					replace(child)
				}
			})
			
			childrenToReplace.forEach((child) => {
				child.replaceWith(convertFurigana(child))
			})
		}
		
		blockToReplace.forEach(block => {
			replace(block)
		})
	}
	
	async onload () {
		this.registerMarkdownPostProcessor(this.postprocessor)
	}
	
	onunload () {}
}
