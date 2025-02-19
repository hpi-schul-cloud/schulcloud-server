import { AccountEntity } from '@modules/account/domain/entity/account.entity';
import { User } from '@modules/user/repo';
import { Role } from '@shared/domain/entity/role.entity';

export const ENTITIES = [Role, User, AccountEntity];
export const TEST_ENTITIES = [...ENTITIES];
