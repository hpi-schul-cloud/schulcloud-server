import { type AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { type EntityId } from '@shared/domain/types';
import { type BoardImportJobStatus } from '../type';

export interface BoardImportJobProps extends AuthorizableObject {
	status: BoardImportJobStatus;

	userId: EntityId;

	link: string;

	expiresAt: Date;
}

export class BoardImportJob extends DomainObject<BoardImportJobProps> {
	get status(): BoardImportJobStatus {
		return this.props.status;
	}

	set status(value: BoardImportJobStatus) {
		this.props.status = value;
	}

	get userId(): EntityId {
		return this.props.userId;
	}

	get link(): string {
		return this.props.link;
	}

	get expiresAt(): Date {
		return this.props.expiresAt;
	}
}
