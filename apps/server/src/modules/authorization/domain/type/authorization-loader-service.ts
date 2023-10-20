import { BaseDO, EntityId } from '@shared/domain';
import { AuthorizableObject } from '@shared/domain/domain-object'; // fix import when it is avaible

export interface AuthorizationLoaderService {
	findById(id: EntityId): Promise<AuthorizableObject | BaseDO>;
}

export interface AuthorizationLoaderServiceGeneric<T extends AuthorizableObject | BaseDO>
	extends AuthorizationLoaderService {
	findById(id: EntityId): Promise<T>;
}
