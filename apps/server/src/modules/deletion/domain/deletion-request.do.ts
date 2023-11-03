import { EntityId } from '@shared/domain/types';
import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { DeletionDomainModel } from './types/deletion-domain-model.enum';
import { DeletionStatusModel } from './types/deletion-status-model.enum';

export interface DeletionRequestProps extends AuthorizableObject {
	createdAt?: Date;
	updatedAt?: Date;
	targetRefDomain: DeletionDomainModel;
	deleteAfter: Date;
	targetRefId: EntityId;
	status: DeletionStatusModel;
}

export class DeletionRequest extends DomainObject<DeletionRequestProps> {
	get createdAt(): Date | undefined {
		return this.props.createdAt;
	}

	get updatedAt(): Date | undefined {
		return this.props.updatedAt;
	}

	get targetRefDomain(): DeletionDomainModel {
		return this.props.targetRefDomain;
	}

	get deleteAfter(): Date {
		return this.props.deleteAfter;
	}

	get targetRefId(): EntityId {
		return this.props.targetRefId;
	}

	get status(): DeletionStatusModel {
		return this.props.status;
	}
}
