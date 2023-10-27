import { EntityId } from '@shared/domain/types';
import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { DeletionDomainModel } from './types/deletion-domain-model.enum';
import { DeletionOperationModel } from './types/deletion-operation-model.enum';

export interface DeletionLogProps extends AuthorizableObject {
	createdAt: Date;
	updatedAt: Date;
	domain?: DeletionDomainModel;
	operation?: DeletionOperationModel;
	modifiedCounter?: number;
	deletedCounter?: number;
	deletionRequestId?: EntityId;
}

export class DeletionLog extends DomainObject<DeletionLogProps> {
	get createdAt(): Date {
		return this.props.createdAt;
	}

	get updatedAt(): Date {
		return this.props.updatedAt;
	}

	get domain(): DeletionDomainModel | undefined {
		return this.props.domain;
	}

	get operation(): DeletionOperationModel | undefined {
		return this.props.operation;
	}

	get modifiedCounter(): number | undefined {
		return this.props.modifiedCounter;
	}

	get deletedCounter(): number | undefined {
		return this.props.deletedCounter;
	}

	get deletionRequestId(): EntityId | undefined {
		return this.props.deletionRequestId;
	}
}
