import { type AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { type EntityId } from '@shared/domain/types';
import {
	type BoardImportJobLogReason,
	BoardImportJobStatus,
	type BoardImportNote,
	type BoardImportSource,
	type BoardImportTarget,
} from '../type';

export interface BoardImportJobProps extends AuthorizableObject {
	status: BoardImportJobStatus;

	userId: EntityId;

	source: BoardImportSource;

	target: BoardImportTarget;

	expiresAt: Date;

	attempts: number;

	startedAt?: Date;

	boardId?: EntityId;

	notes: BoardImportNote[];

	failureReason?: BoardImportJobLogReason;
}

export class BoardImportJob extends DomainObject<BoardImportJobProps> {
	get status(): BoardImportJobStatus {
		return this.props.status;
	}

	get userId(): EntityId {
		return this.props.userId;
	}

	get source(): BoardImportSource {
		return this.props.source;
	}

	get target(): BoardImportTarget {
		return this.props.target;
	}

	get expiresAt(): Date {
		return this.props.expiresAt;
	}

	get attempts(): number {
		return this.props.attempts;
	}

	get startedAt(): Date | undefined {
		return this.props.startedAt;
	}

	get boardId(): EntityId | undefined {
		return this.props.boardId;
	}

	get notes(): BoardImportNote[] {
		return this.props.notes;
	}

	get failureReason(): BoardImportJobLogReason | undefined {
		return this.props.failureReason;
	}

	// The maximum duration counts from the first start. A job that did not start yet counts from now.
	public getDeadline(maxDurationInMs: number, now: Date): Date {
		const startedAt = this.props.startedAt ?? now;
		const deadline = new Date(startedAt.getTime() + maxDurationInMs);

		return deadline;
	}

	public isClosed(): boolean {
		const isClosed =
			this.props.status === BoardImportJobStatus.FINISHED || this.props.status === BoardImportJobStatus.FAILED;

		return isClosed;
	}
}
