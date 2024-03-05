import { Entity, Property } from '@mikro-orm/core';
import {
	AnyBoardDo,
	BoardExternalReference,
	BoardExternalReferenceType,
} from '@shared/domain/domainobject/board/types';
import { ObjectId } from 'bson';
import { BoardNode, BoardNodeProps } from './boardnode.entity';
import { BoardDoBuilder } from './types';
import { BoardNodeType } from './types/board-node-type';
import { LearnroomElement } from '../../interface';

@Entity({ discriminatorValue: BoardNodeType.COLUMN_BOARD })
export class ColumnBoardNode extends BoardNode implements LearnroomElement {
	constructor(props: ColumnBoardNodeProps) {
		super(props);
		this.type = BoardNodeType.COLUMN_BOARD;

		this._contextType = props.context.type;
		this._contextId = new ObjectId(props.context.id);

		this.isVisible = props.isVisible ?? false;
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

export interface ColumnBoardNodeProps extends BoardNodeProps {
	context: BoardExternalReference;
	isVisible: boolean;
}
