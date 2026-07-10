import { type AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { type EntityId } from '@shared/domain/types';
import { type ReferencedEntityType } from '../../types';

export interface ErwinIdentifierProps extends AuthorizableObject {
	erwinId: string;
	type: ReferencedEntityType;
	referencedEntityId: EntityId;
}

export class ErwinIdentifier extends DomainObject<ErwinIdentifierProps> {
	get erwinId(): string {
		return this.props.erwinId;
	}

	get type(): ReferencedEntityType {
		return this.props.type;
	}

	get referencedEntityId(): EntityId {
		return this.props.referencedEntityId;
	}
}
