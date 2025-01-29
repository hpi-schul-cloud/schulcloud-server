import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { EntityId } from '@shared/domain/types';

export interface DeletionBatchProps extends AuthorizableObject {
	deletionRequestIds: EntityId[];
	createdAt?: Date;
	updatedAt?: Date;
}
// TODO: tests missing
export class DeletionBatch extends DomainObject<DeletionBatchProps> {
	get createdAt(): Date | undefined {
		return this.props.createdAt;
	}

	get updatedAt(): Date | undefined {
		return this.props.updatedAt;
	}

	get deletionRequestIds(): EntityId[] {
		return this.props.deletionRequestIds;
	}
}