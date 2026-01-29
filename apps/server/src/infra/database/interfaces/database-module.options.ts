import { AnyEntity, EntityClass, MigrationsOptions } from '@mikro-orm/core';
import { InternalDatabaseConfig } from './internal-database.config';

export interface DatabaseModuleOptions {
	entities: EntityClass<AnyEntity>[];
	configInjectionToken: string;
	configConstructor: new () => InternalDatabaseConfig;
	migrationOptions?: MigrationsOptions;
}
