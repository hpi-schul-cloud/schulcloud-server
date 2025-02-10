import { MikroOrmModuleSyncOptions } from '@mikro-orm/nestjs';

/**
 * connection options not to be used in module options for the in memory db module as it is overriding the connection
 */
type ConnectionOptions = 'type' | 'driver' | 'clientUrl' | 'dbName' | 'user' | 'password';

export type MongoDatabaseModuleOptions = Omit<MikroOrmModuleSyncOptions, ConnectionOptions>;
