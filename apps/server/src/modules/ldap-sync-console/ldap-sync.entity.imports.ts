import { SystemEntity } from '@modules/system/repo';

/**
 * The LDAP sync primarily uses legacy Feathers services.
 * Only minimal MikroORM entities are required for the console bootstrap.
 */
export const ENTITIES = [SystemEntity];
