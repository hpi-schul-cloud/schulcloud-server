import { Entity, Property } from '@mikro-orm/core';
import { LearnroomElement } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { ObjectId } from 'bson';
import { BaseEntityWithTimestamps } from '../base.entity';

type ColumnBoardTargetProps = {
	columnBoardId: EntityId;
	title?: string;
};

@Entity()
export class ColumnBoardTarget extends BaseEntityWithTimestamps implements LearnroomElement {
	constructor(props: ColumnBoardTargetProps) {
		super();
		this._columnBoardId = new ObjectId(props.columnBoardId);
		this.title = props.title ?? '';
	}

	@Property()
	title: string;

	publish(): void {
		this.published = true;
		// TODO sync with columnboard entity here?
	}

	unpublish(): void {
		this.published = false;
	}

	@Property({ type: 'boolean' })
	published = false;

	@Property({ fieldName: 'columnBoard' })
	_columnBoardId: ObjectId; // TODO why object id instead of entityId?

	get columnBoardId(): EntityId {
		return this._columnBoardId.toHexString();
	}
}

export function isColumnBoardTarget(reference: unknown): reference is ColumnBoardTarget {
	return reference instanceof ColumnBoardTarget;
}
