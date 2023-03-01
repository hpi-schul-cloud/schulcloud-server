import { Entity, Enum, Property } from '@mikro-orm/core';
import { InternalServerErrorException } from '@nestjs/common';
import { BaseEntityWithTimestamps } from './base.entity';

export enum BoardNodeType {
	BOARD = 'board',
	COLUMN = 'column',
	CARD = 'card',
	ELEMENT = 'element',
}

export interface BoardNodeProperties {
	type: BoardNodeType;
	parent?: BoardNode;
	position?: number;
	// we could use polymorphic embeddables here
	// see: https://mikro-orm.io/docs/embeddables#polymorphic-embeddables
	// data: BoardNodeData
}

@Entity({ tableName: 'boardnodes' })
export class BoardNode extends BaseEntityWithTimestamps {
	constructor(props: BoardNodeProperties) {
		super();
		if (props.parent && props.parent.id == null) {
			throw new InternalServerErrorException('Cannot create board node with a parent having no id');
		}
		this.type = props.type;
		this.path = props.parent
			? `${props.parent.path}${props.parent.id}${BoardNode.PATH_SEPERATOR}`
			: BoardNode.PATH_SEPERATOR;
		this.level = props.parent ? props.parent.level + 1 : 0;
		this.position = props.position ?? 0;
	}

	static PATH_SEPERATOR = ',';

	@Enum(() => BoardNodeType)
	type: BoardNodeType;

	@Property({ nullable: false })
	path: string;

	@Property({ nullable: false })
	level: number;

	@Property({ nullable: false })
	position: number;
}
