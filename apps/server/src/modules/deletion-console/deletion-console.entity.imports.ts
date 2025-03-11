import { AccountEntity } from '@modules/account/domain/entity/account.entity';
import { Role } from '@modules/role/repo';
import { User } from '@modules/user/repo';

export const ENTITIES = [Role, User, AccountEntity];
export const TEST_ENTITIES = [...ENTITIES];
