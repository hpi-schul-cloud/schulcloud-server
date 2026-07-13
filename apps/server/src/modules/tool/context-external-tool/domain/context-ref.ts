import { type ToolContextType } from '../../common/enum';

export class ContextRef {
	public id: string;

	public type: ToolContextType;

	constructor(props: ContextRef) {
		this.id = props.id;
		this.type = props.type;
	}
}
