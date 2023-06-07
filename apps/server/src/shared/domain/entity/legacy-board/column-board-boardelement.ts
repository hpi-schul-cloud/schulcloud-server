import { Entity, ManyToOne } from '@mikro-orm/core';
import { BoardElement, BoardElementType } from './boardelement.entity';
import { ColumnBoardTarget } from './column-board-target.entity';

@Entity({ discriminatorValue: BoardElementType.ColumnBoard })
export class ColumnboardBoardElement extends BoardElement {
	constructor(props: { target: ColumnBoardTarget }) {
		super(props);
		this.boardElementType = BoardElementType.ColumnBoard;
	}

	@ManyToOne('ColumnBoardTarget')
	target!: ColumnBoardTarget;
}
