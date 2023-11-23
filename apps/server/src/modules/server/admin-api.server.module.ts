import { MikroOrmModule } from '@mikro-orm/nestjs';
import { DynamicModule, Inject, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ALL_ENTITIES } from '@shared/domain';
import { DB_PASSWORD, DB_URL, DB_USERNAME, createConfigModuleOptions } from '@src/config';
import { LegacyLogger, LoggerModule } from '@src/core/logger';
import { ConfigModule } from '@nestjs/config';
import { RabbitMQWrapperModule, RabbitMQWrapperTestModule } from '@src/infra/rabbitmq';
import { MongoDatabaseModuleOptions, MongoMemoryDatabaseModule } from '@src/infra/database';
import { FileEntity } from '@modules/files/entity';
import { FileRecord } from '@modules/files-storage/entity';
import { RedisClient } from 'redis';
import { REDIS_CLIENT, RedisModule } from '@src/infra/redis';
import { defaultMikroOrmOptions } from './server.module';
import { serverConfig, setupSessions } from './server.config';
import { AdminApiServerController } from './controller';
import { DeletionApiModule } from '../deletion/deletion-api.module';

const serverModules = [ConfigModule.forRoot(createConfigModuleOptions(serverConfig)), DeletionApiModule];

@Module({
	imports: [
		RabbitMQWrapperModule,
		...serverModules,
		MikroOrmModule.forRoot({
			...defaultMikroOrmOptions,
			type: 'mongo',
			clientUrl: DB_URL,
			password: DB_PASSWORD,
			user: DB_USERNAME,
			entities: [...ALL_ENTITIES, FileEntity, FileRecord],
			debug: true,
		}),
		LoggerModule,
		RedisModule,
	],
	controllers: [AdminApiServerController],
})
export class AdminApiServerModule implements NestModule {
	constructor(
		@Inject(REDIS_CLIENT) private readonly redisClient: RedisClient | undefined,
		private readonly logger: LegacyLogger
	) {
		logger.setContext(AdminApiServerModule.name);
	}

	configure(consumer: MiddlewareConsumer) {
		setupSessions(consumer, this.redisClient, this.logger);
	}
}

@Module({
	imports: [
		...serverModules,
		MongoMemoryDatabaseModule.forRoot({ ...defaultMikroOrmOptions }),
		RabbitMQWrapperTestModule,
		LoggerModule,
		RedisModule,
	],
	controllers: [AdminApiServerController],
})
export class AdminApiServerTestModule implements NestModule {
	constructor(
		@Inject(REDIS_CLIENT) private readonly redisClient: RedisClient | undefined,
		private readonly logger: LegacyLogger
	) {
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
			controllers: [AdminApiServerController],
		};
	}
}
