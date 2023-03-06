import { Entity, Property } from '@mikro-orm/core';
import { BoardNode, BoardNodeProperties } from './boardnode.entity';
import { BoardNodeType } from './types/board-node-type';

@Entity({ discriminatorValue: BoardNodeType.COLUMN_BOARD })
export class ColumnBoardNode extends BoardNode {
	constructor(props: ColumnBoardNodeProperties) {
		super(props);
		this.type = BoardNodeType.COLUMN_BOARD;
		this.title = props.title;
	}

	@Property()
	title: string;
}

export interface ColumnBoardNodeProperties extends BoardNodeProperties {
	title: string;
}
