import { AuthorizableObject, DomainObject } from '../domain-object';
import { EntityId } from '../types/entity-id';

export interface PseudonymProps extends AuthorizableObject {
	pseudonym: string;
	toolId: EntityId;
	userId: EntityId;
	createdAt: Date;
	updatedAt: Date;
}

export class Pseudonym extends DomainObject<PseudonymProps> {
	get pseudonym(): string {
		return this.props.pseudonym;
	}

	get toolId(): EntityId {
		return this.props.toolId;
	}

	get userId(): EntityId {
		return this.props.userId;
	}

	get createdAt(): Date {
		return this.props.createdAt;
	}

	get updatedAt(): Date {
		return this.props.updatedAt;
	}
}
