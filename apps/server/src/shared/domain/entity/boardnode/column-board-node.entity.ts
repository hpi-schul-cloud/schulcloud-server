import { Entity, Index, Property } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import {
	AnyBoardDo,
	BoardExternalReference,
	BoardExternalReferenceType,
	BoardLayout,
} from '@shared/domain/domainobject/board/types';
import { LearnroomElement } from '../../interface';
import { BoardNode } from './boardnode.entity';
import { type RootBoardNodeProps } from './root-board-node.entity';
import { BoardDoBuilder, BoardNodeType } from './types';

// TODO Use an abstract base class for root nodes that have a contextId and a contextType. Multiple STI abstract base classes are blocked by MikroORM 6.1.2 (issue #3745)
@Entity({ discriminatorValue: BoardNodeType.COLUMN_BOARD })
@Index({ properties: ['_contextId', '_contextType'] })
export class ColumnBoardNode extends BoardNode implements LearnroomElement {
	constructor(props: ColumnBoardNodeProps) {
		super(props);
		this.type = BoardNodeType.COLUMN_BOARD;

		this._contextType = props.context.type;
		this._contextId = new ObjectId(props.context.id);

		this.isVisible = props.isVisible ?? false;

		this.layout = props.layout ?? BoardLayout.COLUMNS;
	}

	@Property({ fieldName: 'contextType' })
	_contextType: BoardExternalReferenceType;

	@Property({ fieldName: 'context' })
	_contextId: ObjectId;

	@Property({ type: 'boolean', nullable: false })
	isVisible = false;

	get context(): BoardExternalReference {
		return {
			type: this._contextType,
			id: this._contextId.toHexString(),
		};
	}

	@Property({ nullable: false })
	layout: BoardLayout;

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
	layout: BoardLayout;
}
