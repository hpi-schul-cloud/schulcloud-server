import { EntityName } from '@mikro-orm/core';
import { EntityId } from '@shared/domain/types';
import { ErwinIdentifierEntity } from '../../repo/entity';
import { ErwinIdentifier } from '../do';

export interface ErwinIdentifierRepo {
	get entityName(): EntityName<ErwinIdentifierEntity>;

	create(erwinIdentifier: ErwinIdentifier): Promise<void>;

	findById(erwinIdentifierEntityId: EntityId): Promise<ErwinIdentifier>;

	findByErwinId(erwinId: string): Promise<ErwinIdentifier | null>;

	findByReferencedEntityId(referencedEntityId: EntityId): Promise<ErwinIdentifier | null>;
}
