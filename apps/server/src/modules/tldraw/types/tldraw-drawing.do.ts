import { BaseDO, EntityId } from '@shared/domain';

export class TldrawDrawingDo extends BaseDO {
	id: EntityId;

	docName: string;

	version: string;

	value: string;

	clock?: number;

	action?: string;

	constructor(params: TldrawDrawingDo) {
		super();
		this.id = params.id;
		this.docName = params.docName;
		this.version = params.version;
		this.value = params.value;
		this.clock = params.clock;
		this.action = params.action;
	}
}
