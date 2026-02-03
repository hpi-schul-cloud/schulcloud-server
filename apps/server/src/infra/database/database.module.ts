import { ConfigurationModule } from '@infra/configuration';
import { defineConfig } from '@mikro-orm/core';
import { MongoDriver } from '@mikro-orm/mongodb';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { DynamicModule, Module } from '@nestjs/common';
import { findOneOrFailHandler } from '@shared/common/database-error.handler';
import { DatabaseConfig } from './database.config';
import { DatabaseModuleOptions } from './interfaces/database-module.options';

@Module({})
export class DatabaseModule {
	public static register(options: DatabaseModuleOptions): DynamicModule {
		return {
			module: DatabaseModule,
			imports: [
				MikroOrmModule.forRootAsync({
					useFactory: (config: DatabaseConfig) =>
						defineConfig({
							findOneOrFailHandler,
							driver: MongoDriver,
							clientUrl: config.dbUrl,
							password: config.dbPassword,
							user: config.dbUsername,
							entities: options.entities,
							ensureIndexes: config.dbEnsureIndexes,
							allowGlobalContext: config.dbAllowGlobalContext,
							debug: config.dbDebug,
							migrations: options.migrationOptions,
						}),
					inject: [options.configInjectionToken],
					imports: [ConfigurationModule.register(options.configInjectionToken, options.configConstructor)],
				}),
			],
			providers: [],
		};
	}
}
