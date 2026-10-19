import { Entity, ManyToOne } from '@mikro-orm/decorators/legacy';
import { BoardNodeEntity } from '@modules/board/repo/entity/board-node.entity';
import { LegacyBoardElement, LegacyBoardElementType } from './legacy-board-element.entity';

@Entity({ discriminatorValue: LegacyBoardElementType.ColumnBoard })
export class ColumnBoardBoardElement extends LegacyBoardElement {
	constructor(props: { target: BoardNodeEntity }) {
		super(props);
		this.boardElementType = LegacyBoardElementType.ColumnBoard;
	}

	@ManyToOne(() => BoardNodeEntity, { fieldName: 'target', nullable: false })
	target!: BoardNodeEntity;
}
