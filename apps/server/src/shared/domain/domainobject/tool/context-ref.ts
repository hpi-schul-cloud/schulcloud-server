import { ToolContextType } from 'apps/server/src/modules/tool/common/interface';

export class ContextRef {
	id: string;

	type: ToolContextType;

	constructor(props: ContextRef) {
		this.id = props.id;
		this.type = props.type;
	}
}
