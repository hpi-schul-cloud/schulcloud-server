import { AuthorizableObject, EntityId } from '@shared/domain';

export interface AuthorizationLoaderService {
	findById(id: EntityId): Promise<AuthorizableObject>;
}
