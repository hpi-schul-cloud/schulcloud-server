import { SchoolSystemOptionsEntity } from '@modules/legacy-school/entity';
import { SchoolEntity } from '@modules/school/repo';
import { SystemEntity } from '@modules/system/repo';
import { UserLoginMigrationEntity } from '@modules/user-login-migration/repo';

/**
 * The LDAP sync primarily uses legacy Feathers services.
 * Only minimal MikroORM entities are required for the console bootstrap.
 */
export const ENTITIES = [SystemEntity];

export const TEST_ENTITIES = [SchoolEntity, SchoolSystemOptionsEntity, UserLoginMigrationEntity, ...ENTITIES];
