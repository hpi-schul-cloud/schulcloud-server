import { AnyEntity, EntityClass, MigrationsOptions } from '@mikro-orm/core';

export interface InternalDatabaseConfig {
	dbUrl: string;
	dbUsername?: string;
	dbPassword?: string;
	dbEnsureIndexes: boolean;
	dbDebug: boolean;
}

export interface DatabaseModuleOptions {
	entities: EntityClass<AnyEntity>[];
	configInjectionToken: string;
	configConstructor: new () => InternalDatabaseConfig;
	migrationOptions?: MigrationsOptions;
}
