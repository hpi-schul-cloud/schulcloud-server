import { Entity, Index, Property } from '@mikro-orm/core';
import { BadRequestException } from '@nestjs/common';
import { BaseEntity } from '@shared/domain/entity';

export interface TldrawDrawingProps {
	_id?: string;
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
		if (!props.docName) throw new BadRequestException('Tldraw element should have name.');
		this.docName = props.docName;
		this.version = props.version;
		this.value = props.value;
		if (typeof props.clock === 'number') {
			this.clock = props.clock;
		}
		if (props.action) {
			this.action = props.action;
		}
		if (typeof props.part === 'number') {
			this.part = props.part;
		}
	}
}
