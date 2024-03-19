import { SystemEntity } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types/entity-id';
import { BaseDomainObjectRepo } from '@shared/repo/base-domain-object.repo';
import { System } from '../system.do';

export interface SystemRepo extends BaseDomainObjectRepo<System, SystemEntity> {
	getSystemsByIds(systemIds: EntityId[]): Promise<System[]>;

	getSystemById(systemId: EntityId): Promise<System | null>;

	findAllForLdapLogin(): Promise<System[]>;

	delete(domainObject: System): Promise<void>;
}

export const SYSTEM_REPO = 'SYSTEM_REPO';
