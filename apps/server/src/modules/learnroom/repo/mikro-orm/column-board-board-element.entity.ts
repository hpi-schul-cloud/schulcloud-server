import { Entity, ManyToOne } from '@mikro-orm/core';
import { ColumnBoardNode } from './column-board-node.entity';
import { LegacyBoardElement, LegacyBoardElementType } from './legacy-board-element.entity';

@Entity({ discriminatorValue: LegacyBoardElementType.ColumnBoard })
export class ColumnBoardBoardElement extends LegacyBoardElement {
	constructor(props: { target: ColumnBoardNode }) {
		super(props);
		this.boardElementType = LegacyBoardElementType.ColumnBoard;
	}

	@ManyToOne('ColumnBoardNode')
	target!: ColumnBoardNode;
}
