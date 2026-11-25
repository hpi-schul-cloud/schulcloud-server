import { type AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { type EntityId } from '@shared/domain/types';
import { BoardImportJobStatus, type BoardImportTarget } from '../type';

export interface BoardImportJobProps extends AuthorizableObject {
	status: BoardImportJobStatus;

	userId: EntityId;

	link: string;

	target: BoardImportTarget;

	expiresAt: Date;

	attempts: number;

	startedAt?: Date;
}

export class BoardImportJob extends DomainObject<BoardImportJobProps> {
	get status(): BoardImportJobStatus {
		return this.props.status;
	}

	get userId(): EntityId {
		return this.props.userId;
	}

	get link(): string {
		return this.props.link;
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

	public isClosed(): boolean {
		const isClosed =
			this.props.status === BoardImportJobStatus.FINISHED || this.props.status === BoardImportJobStatus.FAILED;

		return isClosed;
	}
}
