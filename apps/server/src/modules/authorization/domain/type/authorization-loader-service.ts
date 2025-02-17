import type { AuthorizableObject } from '@shared/domain/domain-object'; // fix import when it is avaible
import type { BaseDO } from '@shared/domain/domainobject';
import type { EntityId } from '@shared/domain/types';

export interface AuthorizationLoaderService {
	findById(id: EntityId): Promise<AuthorizableObject | BaseDO>;
}
export interface AuthorizationLoaderServiceGeneric<T extends AuthorizableObject | BaseDO>
	extends AuthorizationLoaderService {
	findById(id: EntityId): Promise<T>;
}
