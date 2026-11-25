import { Entity, Enum, Index, Property } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { BaseEntityWithTimestamps } from '@shared/domain/entity';
import { type EntityId } from '@shared/domain/types';
import { BoardImportJobStatus } from '../../domain';

export interface BoardImportJobEntityProps {
	id?: EntityId;

	status: BoardImportJobStatus;

	userId: ObjectId;

	link: string;

	expiresAt: Date;

	attempts: number;

	startedAt?: Date;
}

@Entity({ tableName: 'board-import-jobs' })
export class BoardImportJobEntity extends BaseEntityWithTimestamps {
	@Enum(() => BoardImportJobStatus)
	status: BoardImportJobStatus;

	@Property()
	userId: ObjectId;

	@Property()
	link: string;

	@Index({ options: { expireAfterSeconds: 0 } })
	@Property()
	expiresAt: Date;

	@Property()
	attempts: number;

	@Property({ nullable: true })
	startedAt?: Date;

	constructor(props: BoardImportJobEntityProps) {
		super();
		if (props.id) {
			this.id = props.id;
		}
		this.status = props.status;
		this.userId = props.userId;
		this.link = props.link;
		this.expiresAt = props.expiresAt;
		this.attempts = props.attempts;
		this.startedAt = props.startedAt;
	}
}
