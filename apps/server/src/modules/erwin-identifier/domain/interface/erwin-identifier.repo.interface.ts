import { EntityId } from '@shared/domain/types';
import { ErwinIdentifier } from '../do';

export interface ErwinIdentifierRepo {
	create(erwinIdentifier: ErwinIdentifier): Promise<void>;

	findById(erwinIdentifierEntityId: EntityId): Promise<ErwinIdentifier | null>;

	findByErwinId(erwinId: string): Promise<ErwinIdentifier | null>;

	findByReferencedEntityId(referencedEntityId: EntityId): Promise<ErwinIdentifier | null>;

	deleteById(erwinIdentifierEntityId: EntityId): Promise<void>;
}
