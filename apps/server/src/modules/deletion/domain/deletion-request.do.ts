import { EntityId } from '@shared/domain/types';
import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { DeletionDomainModel } from './types/deletion-domain-model.enum';
import { DeletionStatusModel } from './types/deletion-status-model.enum';

export interface DeletionRequestProps extends AuthorizableObject {
	createdAt?: Date;
	updatedAt?: Date;
	domain?: DeletionDomainModel;
	deleteAfter?: Date;
	itemId?: EntityId;
	status?: DeletionStatusModel;
}

export class DeletionRequest extends DomainObject<DeletionRequestProps> {
	get createdAt(): Date | undefined {
		return this.props.createdAt;
	}

	get updatedAt(): Date | undefined {
		return this.props.updatedAt;
	}

	get domain(): DeletionDomainModel | undefined {
		return this.props.domain;
	}

	get deleteAfter(): Date | undefined {
		return this.props.deleteAfter;
	}

	get itemId(): EntityId | undefined {
		return this.props.itemId;
	}

	get status(): DeletionStatusModel | undefined {
		return this.props.status;
	}
}
