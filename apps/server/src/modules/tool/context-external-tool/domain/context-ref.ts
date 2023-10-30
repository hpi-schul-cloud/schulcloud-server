import { ToolContextType } from '../../common/enum/tool-context-type.enum';

export class ContextRef {
	id: string;

	type: ToolContextType;

	constructor(props: ContextRef) {
		this.id = props.id;
		this.type = props.type;
	}
}
