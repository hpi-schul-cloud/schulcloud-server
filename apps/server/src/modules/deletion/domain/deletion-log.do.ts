import { DomainModel, EntityId } from '@shared/domain/types';
import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { DeletionOperationModel } from './types';

export interface DeletionLogProps extends AuthorizableObject {
	createdAt?: Date;
	updatedAt?: Date;
	domain: DomainModel;
	operation?: DeletionOperationModel;
	modifiedCount: number;
	deletedCount: number;
	deletionRequestId?: EntityId;
	performedAt?: Date;
}

export class DeletionLog extends DomainObject<DeletionLogProps> {
	get createdAt(): Date | undefined {
		return this.props.createdAt;
	}

	get updatedAt(): Date | undefined {
		return this.props.updatedAt;
	}

	get domain(): DomainModel {
		return this.props.domain;
	}

	get operation(): DeletionOperationModel | undefined {
		return this.props.operation;
	}

	get modifiedCount(): number {
		return this.props.modifiedCount;
	}

	get deletedCount(): number {
		return this.props.deletedCount;
	}

	get deletionRequestId(): EntityId | undefined {
		return this.props.deletionRequestId;
	}

	get performedAt(): Date | undefined {
		return this.props.performedAt;
	}
}
