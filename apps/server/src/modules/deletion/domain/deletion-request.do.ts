import { EntityId } from '@shared/domain/types';
import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';

export interface DeletionRequestProps extends AuthorizableObject {
	createdAt?: Date;
	updatedAt?: Date;
	source?: string;
	deleteAfter?: Date;
	userId?: EntityId;
}

export class DeletionRequest extends DomainObject<DeletionRequestProps> {
	get createdAt(): Date | undefined {
		return this.props.createdAt;
	}

	get updatedAt(): Date | undefined {
		return this.props.updatedAt;
	}

	get source(): string | undefined {
		return this.props.source;
	}

	get deleteAfter(): Date | undefined {
		return this.props.deleteAfter;
	}

	get userId(): EntityId | undefined {
		return this.props.userId;
	}
}
