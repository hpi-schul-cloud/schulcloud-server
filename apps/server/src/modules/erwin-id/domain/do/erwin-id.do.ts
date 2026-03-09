import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { EntityId } from '@shared/domain/types';
import { ErwinIdReferencedEntityType } from '../../types';

export interface ErwinIdProps extends AuthorizableObject {
	erwinId: string;
	type: ErwinIdReferencedEntityType;
	erwinIdReferencedEntityId: EntityId;
}

export class ErwinId extends DomainObject<ErwinIdProps> {
	get erwinId(): string {
		return this.props.erwinId;
	}

	get type(): ErwinIdReferencedEntityType {
		return this.props.type;
	}

	get erwinIdReferencedEntityId(): EntityId {
		return this.props.erwinIdReferencedEntityId;
	}
}
