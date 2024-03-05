import { Entity, ManyToOne } from '@mikro-orm/core';
import { LegacyBoardElement, LegacyBoardElementType } from './legacy-boardelement.entity';
// import { ColumnBoardTarget } from './column-board-target.entity';
import { ColumnBoardNode } from '../boardnode';

@Entity({ discriminatorValue: LegacyBoardElementType.ColumnBoard })
export class ColumnboardBoardElement extends LegacyBoardElement {
	constructor(props: { target: ColumnBoardNode }) {
		super(props);
		this.boardElementType = LegacyBoardElementType.ColumnBoard;
	}

	@ManyToOne('ColumnBoardNode')
	target!: ColumnBoardNode;
}
