import { Entity, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps, EntityId } from '@shared/domain';
import { ObjectId } from '@mikro-orm/mongodb';

export interface DeletionRequestEntityProps {
	id?: EntityId;
	source?: string;
	deleteAfter?: Date;
	userId?: ObjectId;
}

@Entity({ tableName: 'deletionrequests' })
export class DeletionRequestEntity extends BaseEntityWithTimestamps {
	@Property({ nullable: true })
	deleteAfter?: Date;

	@Property({ fieldName: 'userToDeletion', nullable: true })
	userId?: ObjectId;

	@Property({ nullable: true })
	source?: string;

	constructor(props: DeletionRequestEntityProps) {
		super();

		if (props.source !== undefined) {
			this.source = props.source;
		}

		if (props.deleteAfter !== undefined) {
			this.deleteAfter = props.deleteAfter;
		}

		if (props.userId !== undefined) {
			this.userId = props.userId;
		}
	}
}
