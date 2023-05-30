import { Entity, Property } from '@mikro-orm/core';
import { ILearnroomElement } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { ObjectId } from 'bson';
import { BaseEntityWithTimestamps } from '../base.entity';

@Entity()
export class ColumnBoardTarget extends BaseEntityWithTimestamps implements ILearnroomElement {
	constructor(props: { columnBoardId: EntityId }) {
		super();
		this._columnBoardId = new ObjectId(props.columnBoardId);
	}

	publish(): void {
		this.published = true;
	}

	unpublish(): void {
		this.published = false;
	}

	@Property()
	published = false;

	@Property({ fieldName: 'columnBoard' })
	_columnBoardId: ObjectId;

	get columnBoardId(): EntityId {
		return this._columnBoardId.toHexString();
	}
}
