import { Entity, ManyToOne } from '@mikro-orm/core';
import { BoardElement, BoardElementType } from './boardelement.entity';
// import { ColumnBoardTarget } from './column-board-target.entity';
import { ColumnBoardNode } from '../boardnode';

@Entity({ discriminatorValue: BoardElementType.ColumnBoard })
export class ColumnboardBoardElement extends BoardElement {
	constructor(props: { target: ColumnBoardNode }) {
		super(props);
		this.boardElementType = BoardElementType.ColumnBoard;
	}

	@ManyToOne('ColumnBoardNode')
	target!: ColumnBoardNode;
}
