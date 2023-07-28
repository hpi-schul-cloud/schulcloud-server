import { ToolContextType } from '../../common/enum';

export class ContextRef {
	id: string;

	type: ToolContextType;

	constructor(props: ContextRef) {
		this.id = props.id;
		this.type = props.type;
	}
}
