import { EntityId } from '@shared/domain/types';
import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { DeletionStatusModel } from './types';
import { DomainName } from '../types';

export interface DeletionRequestProps extends AuthorizableObject {
	createdAt?: Date;
	updatedAt?: Date;
	targetRefDomain: DomainName;
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

	get targetRefDomain(): DomainName {
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
