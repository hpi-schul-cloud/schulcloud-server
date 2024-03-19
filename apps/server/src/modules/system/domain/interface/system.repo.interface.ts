import { EntityId } from '@shared/domain/types/entity-id';
import { System } from '../system.do';

export interface SystemRepo {
	getSystemsByIds(systemIds: EntityId[]): Promise<System[]>;

	getSystemById(systemId: EntityId): Promise<System | null>;

	findAllForLdapLogin(): Promise<System[]>;

	delete(domainObject: System): Promise<void>;

	save(domainObject: System): Promise<System>;
}

export const SYSTEM_REPO = 'SYSTEM_REPO';
