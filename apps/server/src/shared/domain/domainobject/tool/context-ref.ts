import { ToolContextType } from '@src/modules/tool/interface';

export class ContextRef {
	id: string;

	type: ToolContextType;

	constructor(props: ContextRef) {
		this.id = props.id;
		this.type = props.type;
	}
}
