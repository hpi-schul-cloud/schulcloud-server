import { Entity, ManyToOne } from '@mikro-orm/core';
import { ColumnBoardNode } from '@modules/learnroom/repo';
import { LegacyBoardElementType, LegacyBoardElement } from '@shared/domain/entity';

@Entity({ discriminatorValue: LegacyBoardElementType.ColumnBoard })
export class ColumnBoardBoardElement extends LegacyBoardElement {
	constructor(props: { target: ColumnBoardNode }) {
		super(props);
		this.boardElementType = LegacyBoardElementType.ColumnBoard;
	}

	@ManyToOne('ColumnBoardNode')
	target!: ColumnBoardNode;
}
