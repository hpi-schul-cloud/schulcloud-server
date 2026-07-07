import { type AnyEntity, type EntityClass, type MigrationsOptions } from '@mikro-orm/core';
import { type InternalDatabaseConfig } from './internal-database.config';

export interface DatabaseModuleOptions {
	entities: EntityClass<AnyEntity>[];
	configInjectionToken: string;
	configConstructor: new () => InternalDatabaseConfig;
	migrationOptions?: MigrationsOptions;
}
