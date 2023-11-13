import { MikroOrmModule } from '@mikro-orm/nestjs';
import { DynamicModule, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ALL_ENTITIES } from '@shared/domain';
import { DB_PASSWORD, DB_URL, DB_USERNAME, createConfigModuleOptions } from '@src/config';
import { LegacyLogger, LoggerModule } from '@src/core/logger';
import { ConfigModule } from '@nestjs/config';
import { RabbitMQWrapperModule, RabbitMQWrapperTestModule } from '@src/infra/rabbitmq';
import { MongoDatabaseModuleOptions, MongoMemoryDatabaseModule } from '@src/infra/database';
import { DeletionModule } from '../deletion';
import { defaultMikroOrmOptions, setupSessions } from './server.module';
import { serverConfig } from './server.config';
import { ServerController } from './controller/server.controller';

const serverModules = [ConfigModule.forRoot(createConfigModuleOptions(serverConfig)), DeletionModule];

@Module({
	imports: [
		RabbitMQWrapperModule,
		...serverModules,
		MikroOrmModule.forRoot({
			...defaultMikroOrmOptions,
			type: 'mongo',
			// TODO add mongoose options as mongo options (see database.js)
			clientUrl: DB_URL,
			password: DB_PASSWORD,
			user: DB_USERNAME,
			entities: ALL_ENTITIES,

			// debug: true, // use it for locally debugging of queries
		}),
		LoggerModule,
	],
})
export class AdminApiServerModule implements NestModule {
	constructor(private readonly logger: LegacyLogger) {
		logger.setContext(AdminApiServerModule.name);
	}

	configure(consumer: MiddlewareConsumer) {
		setupSessions(consumer, undefined, this.logger);
	}
}

@Module({
	imports: [
		...serverModules,
		MongoMemoryDatabaseModule.forRoot({ ...defaultMikroOrmOptions }),
		RabbitMQWrapperTestModule,
		LoggerModule,
	],
	controllers: [ServerController],
})
export class AdminApiServerTestModule implements NestModule {
	constructor(private readonly logger: LegacyLogger) {
		logger.setContext(AdminApiServerTestModule.name);
	}

	configure(consumer: MiddlewareConsumer) {
		setupSessions(consumer, undefined, this.logger);
	}

	static forRoot(options?: MongoDatabaseModuleOptions): DynamicModule {
		return {
			module: AdminApiServerTestModule,
			imports: [
				...serverModules,
				MongoMemoryDatabaseModule.forRoot({ ...defaultMikroOrmOptions, ...options }),
				RabbitMQWrapperTestModule,
			],
			controllers: [ServerController],
		};
	}
}
