import { ConfigurationModule } from '@infra/configuration';
import { defineConfig } from '@mikro-orm/core';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { DynamicModule, Module } from '@nestjs/common';
import { findOneOrFailHandler } from '@shared/common/database-error.handler';
import { DatabaseModuleOptions } from './database-module.options';
import { DatabaseConfig } from './database.config';

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
							type: 'mongo',
							clientUrl: config.dbUrl,
							password: config.dbPassword,
							user: config.dbUsername,
							entities: options.entities,
							ensureIndexes: config.dbEnsureIndexes,
							allowGlobalContext: config.dbAllowGlobalContext,
							debug: config.dbDebug,
						}),
					inject: [options.configInjectionToken],
					imports: [ConfigurationModule.register(options.configInjectionToken, options.configConstructor)],
				}),
			],
			providers: [],
		};
	}
}
