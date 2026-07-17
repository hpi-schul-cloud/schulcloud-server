import { AccountEntity } from '@modules/account/repo';
import { Role } from '@modules/role/repo';
import { SystemEntity } from '@modules/system/repo';
import { UserLoginMigrationEntity } from '@modules/user-login-migration/repo';
import { User } from '@modules/user/repo';

export const ENTITIES = [Role, User, AccountEntity];
export const TEST_ENTITIES = [SystemEntity, UserLoginMigrationEntity, ...ENTITIES];
