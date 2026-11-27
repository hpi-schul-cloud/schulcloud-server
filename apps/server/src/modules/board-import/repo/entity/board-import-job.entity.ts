import { Embedded, Entity, Enum, Index, Property } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { BaseEntityWithTimestamps } from '@shared/domain/entity';
import { type EntityId } from '@shared/domain/types';
import { BoardImportJobStatus, BoardImportTargetType } from '../../domain';
import { BoardImportNoteEmbeddable } from './board-import-note.embeddable';

export interface BoardImportJobEntityProps {
	id?: EntityId;

	status: BoardImportJobStatus;

	userId: ObjectId;

	link: string;

	sourceType: string;

	targetType: BoardImportTargetType;

	targetId: ObjectId;

	expiresAt: Date;

	attempts: number;

	startedAt?: Date;

	boardId?: ObjectId;

	notes?: BoardImportNoteEmbeddable[];
}

@Entity({ tableName: 'board-import-jobs' })
export class BoardImportJobEntity extends BaseEntityWithTimestamps {
	@Enum(() => BoardImportJobStatus)
	status: BoardImportJobStatus;

	@Property()
	userId: ObjectId;

	@Property()
	link: string;

	@Property()
	sourceType: string;

	@Enum(() => BoardImportTargetType)
	targetType: BoardImportTargetType;

	@Property()
	targetId: ObjectId;

	@Index({ options: { expireAfterSeconds: 0 } })
	@Property()
	expiresAt: Date;

	@Property()
	attempts: number;

	@Property({ nullable: true })
	startedAt?: Date;

	@Property({ nullable: true })
	boardId?: ObjectId;

	@Embedded(() => BoardImportNoteEmbeddable, { array: true, nullable: true })
	notes?: BoardImportNoteEmbeddable[];

	constructor(props: BoardImportJobEntityProps) {
		super();
		if (props.id) {
			this.id = props.id;
		}
		this.status = props.status;
		this.userId = props.userId;
		this.link = props.link;
		this.sourceType = props.sourceType;
		this.targetType = props.targetType;
		this.targetId = props.targetId;
		this.expiresAt = props.expiresAt;
		this.attempts = props.attempts;
		this.startedAt = props.startedAt;
		this.boardId = props.boardId;
		this.notes = props.notes;
	}
}
