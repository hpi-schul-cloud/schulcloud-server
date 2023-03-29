import { Entity } from '@mikro-orm/core';
import { AnyBoardDo } from '../../domainobject';
import { BoardDoBuilder } from './board-do.builder';
import { BoardNode, BoardNodeProps } from './boardnode.entity';
import { BoardNodeType } from './types/board-node-type';

@Entity({ discriminatorValue: BoardNodeType.COLUMN_BOARD })
export class ColumnBoardNode extends BoardNode {
	constructor(props: BoardNodeProps) {
		super(props);
		this.type = BoardNodeType.COLUMN_BOARD;
	}

	useDoBuilder(builder: BoardDoBuilder): AnyBoardDo {
		const domainObject = builder.buildColumnBoard(this);
		return domainObject;
	}
}
