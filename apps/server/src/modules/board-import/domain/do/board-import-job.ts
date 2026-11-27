import { type AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { type EntityId } from '@shared/domain/types';
import {
	BOARD_PLAN_VERSION,
	type BoardImportCheckpoint,
	type BoardImportJobLogReason,
	BoardImportJobStatus,
	type BoardImportNote,
	type BoardImportProgress,
	type BoardImportSource,
	type BoardImportTarget,
	type BoardPlan,
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

	plan?: BoardPlan;

	checkpoints: BoardImportCheckpoint[];
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

	get plan(): BoardPlan | undefined {
		return this.props.plan;
	}

	get checkpoints(): BoardImportCheckpoint[] {
		return this.props.checkpoints;
	}

	public getProgress(): BoardImportProgress | undefined {
		const { plan, checkpoints } = this.props;
		if (plan?.version !== BOARD_PLAN_VERSION) {
			return undefined;
		}

		const total = plan.columns.reduce((count, column) => count + 1 + column.cards.length, 0);
		const imported = checkpoints.reduce((count, checkpoint) => count + 1 + checkpoint.cardIds.length, 0);

		return { total, imported };
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
