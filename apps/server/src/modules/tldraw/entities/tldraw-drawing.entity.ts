import { Entity, Index, Property } from '@mikro-orm/core';
import { BaseEntity } from '@shared/domain/entity/base.entity';

export interface TldrawDrawingProps {
	id?: string;
	docName: string;
	version: string;
	clock?: number;
	action?: string;
	value: Buffer;
	part?: number;
}

@Entity({ tableName: 'drawings' })
@Index({ properties: ['version', 'docName', 'action', 'clock', 'part'] })
export class TldrawDrawing extends BaseEntity {
	@Property({ nullable: false })
	docName: string;

	@Property({ nullable: false })
	version: string;

	@Property({ nullable: false })
	value: Buffer;

	@Property({ nullable: true })
	clock?: number;

	@Property({ nullable: true })
	action?: string;

	@Property({ nullable: true })
	part?: number;

	constructor(props: TldrawDrawingProps) {
		super();
		this.docName = props.docName;
		this.version = props.version;
		this.value = props.value;
		this.clock = props.clock;
		this.action = props.action;
		this.part = props.part;
	}
}
