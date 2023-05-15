import { EntityId } from '@shared/domain';
import { AuthorizableObject } from '@shared/domain/domain-object';

export interface AuthorizationLoaderService {
	findById(id: EntityId): Promise<AuthorizableObject>;
}
