import { EntityId } from '@shared/domain/types/entity-id';
import { System } from '../system.do';
import { SystemQuery } from './system-query';

export interface SystemRepo {
	find(filter: SystemQuery): Promise<System[]>;

	getSystemsByIds(systemIds: EntityId[]): Promise<System[]>;

	getSystemById(systemId: EntityId): Promise<System | null>;

	findByOauth2Issuer(issuer: string): Promise<System | null>;

	findAllForLdapLogin(): Promise<System[]>;

	delete(domainObject: System): Promise<void>;
}

export const SYSTEM_REPO = 'SYSTEM_REPO';
