import { ContextExternalTool } from '../context-external-tool.do';

export class ReplaceElementWithPlaceholderEvent {
	type: string;

	title: string | undefined;

	constructor(tool: ContextExternalTool) {
		this.type = tool.contextRef.type;
		this.title = tool.displayName;
	}
}
