import type { User } from '@modules/user/repo';
import { EntityId } from '@shared/domain/types';

export interface CurrentUserLoader {
	loadCurrentUserWithPermissions(userId: EntityId): Promise<User>;
}
