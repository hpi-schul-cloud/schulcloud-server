import { Entity, Property } from '@mikro-orm/core';
import { AnyBoardDo } from '@shared/domain/domainobject/board/types';
import { LearnroomElement } from '../../interface';
import { RootBoardNode, type RootBoardNodeProps } from './root-board-node.entity';
import { BoardDoBuilder, BoardNodeType } from './types';

@Entity({ discriminatorValue: BoardNodeType.COLUMN_BOARD })
export class ColumnBoardNode extends RootBoardNode implements LearnroomElement {
	constructor(props: ColumnBoardNodeProps) {
		super(props);
		this.type = BoardNodeType.COLUMN_BOARD;

		this.isVisible = props.isVisible ?? false;
	}

	@Property({ type: 'boolean', nullable: false })
	isVisible = false;

	useDoBuilder(builder: BoardDoBuilder): AnyBoardDo {
		const domainObject = builder.buildColumnBoard(this);
		return domainObject;
	}

	/**
	 * @deprecated - this is here only for the sake of the legacy-board (lernraum)
	 */
	publish(): void {
		this.isVisible = true;
	}

	/**
	 * @deprecated - this is here only for the sake of the legacy-board (lernraum)
	 */
	unpublish(): void {
		this.isVisible = false;
	}
}

export interface ColumnBoardNodeProps extends RootBoardNodeProps {
	isVisible: boolean;
}
