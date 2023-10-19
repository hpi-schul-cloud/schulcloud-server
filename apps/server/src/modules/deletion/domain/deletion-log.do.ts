import { EntityId } from '@shared/domain/types';
import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';

export interface DeletionLogProps extends AuthorizableObject {
	createdAt: Date;
	updatedAt: Date;
	scope?: string;
	operation?: string;
	docIds?: EntityId[];
	deletionRequestId?: EntityId;
}

export class DeletionLog extends DomainObject<DeletionLogProps> {
	get createdAt(): Date {
		return this.props.createdAt;
	}

	get updatedAt(): Date {
		return this.props.updatedAt;
	}

	get scope(): string | undefined {
		return this.props.scope;
	}

	get operation(): string | undefined {
		return this.props.operation;
	}

	get deletionRequestId(): EntityId | undefined {
		return this.props.deletionRequestId;
	}

	get docIds(): EntityId[] | undefined {
		return this.props.docIds;
	}
}
