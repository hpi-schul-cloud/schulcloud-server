import { Entity, Property } from '@mikro-orm/core';
import { BoardNode, BoardNodeProperties } from './boardnode.entity';
import { BoardNodeType } from './types/board-node-type';

@Entity({ discriminatorValue: BoardNodeType.COLUMN })
export class ColumnNode extends BoardNode {
	constructor(props: ColumnNodeProperties) {
		super(props);
		this.type = BoardNodeType.COLUMN;
		this.title = props.title;
	}

	@Property()
	title: string;
}

export interface ColumnNodeProperties extends BoardNodeProperties {
	title: string;
}
