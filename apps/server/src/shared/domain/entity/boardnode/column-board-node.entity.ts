import { Entity, Property } from '@mikro-orm/core';
import { AnyBoardDo, BoardExternalReference, BoardExternalReferenceType } from '@shared/domain/domainobject';
import { ObjectId } from 'bson';
import { BoardNode, BoardNodeProps } from './boardnode.entity';
import { BoardDoBuilder } from './types';
import { BoardNodeType } from './types/board-node-type';

@Entity({ discriminatorValue: BoardNodeType.COLUMN_BOARD })
export class ColumnBoardNode extends BoardNode {
	constructor(props: ColumnBoardNodeProps) {
		super(props);
		this.type = BoardNodeType.COLUMN_BOARD;

		this._contextType = props.context.type;
		this._contextId = new ObjectId(props.context.id);
	}

	@Property({ fieldName: 'contextType' })
	_contextType: BoardExternalReferenceType;

	@Property({ fieldName: 'context' })
	_contextId: ObjectId;

	get context(): BoardExternalReference {
		return {
			type: this._contextType,
			id: this._contextId.toHexString(),
		};
	}

	@Property()
	hidden = false; // WIP : BC-3573 : remove from ColumnBoardNode

	publish() {
		this.hidden = false;
	}

	unpublish() {
		this.hidden = true;
	}

	useDoBuilder(builder: BoardDoBuilder): AnyBoardDo {
		const domainObject = builder.buildColumnBoard(this);
		return domainObject;
	}
}

export interface ColumnBoardNodeProps extends BoardNodeProps {
	context: BoardExternalReference;
}
