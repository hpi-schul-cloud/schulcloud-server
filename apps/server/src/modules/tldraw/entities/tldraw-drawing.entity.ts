import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { BadRequestException } from '@nestjs/common';
import { ObjectId } from '@mikro-orm/mongodb';

@Entity({ tableName: 'drawing' })
export class TldrawDrawing {
	constructor(props: TldrawDrawingProps) {
		if (!props.docName) throw new BadRequestException('Tldraw element should have name.');
		this.docName = props.docName;
		this.version = props.version;
		this.value = props.value;
		if (props.clock) {
			this.clock = props.clock;
		}
		if (props.action) {
			this.action = props.action;
		}
	}

	@PrimaryKey()
	_id!: ObjectId;

	@Property({ nullable: false })
	docName: string;

	@Property({ nullable: false })
	version: string;

	@Property({ nullable: false })
	value: string;

	@Property({ nullable: true })
	clock?: number;

	@Property({ nullable: true })
	action?: string;
}

export interface TldrawDrawingProps {
	_id?: string;
	docName: string;
	version: string;
	clock?: number;
	action?: string;
	value: string;
}
