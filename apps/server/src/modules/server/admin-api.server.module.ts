import { MikroOrmModule } from '@mikro-orm/nestjs';
import { DynamicModule, Module } from '@nestjs/common';
import { FileEntity } from '@modules/files/entity';
import { ConfigModule } from '@nestjs/config';
import { ALL_ENTITIES } from '@shared/domain/entity';
import { DB_PASSWORD, DB_URL, DB_USERNAME, createConfigModuleOptions } from '@src/config';
import { LoggerModule } from '@src/core/logger';
import { MongoDatabaseModuleOptions, MongoMemoryDatabaseModule } from '@src/infra/database';
import { RabbitMQWrapperModule, RabbitMQWrapperTestModule } from '@src/infra/rabbitmq';
import { CqrsModule } from '@nestjs/cqrs';
import { DeletionApiModule } from '@modules/deletion/deletion-api.module';
import { LegacySchoolAdminApiModule } from '@modules/legacy-school/legacy-school-admin.api-module';
import { UserAdminApiModule } from '@modules/user/user-admin-api.module';
import { serverConfig } from './server.config';
import { defaultMikroOrmOptions } from './server.module';

const serverModules = [
	ConfigModule.forRoot(createConfigModuleOptions(serverConfig)),
	DeletionApiModule,
	LegacySchoolAdminApiModule,
	UserAdminApiModule,
];

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
			entities: [...ALL_ENTITIES, FileEntity],
			debug: true,
		}),
		CqrsModule,
		LoggerModule,
	],
})
export class AdminApiServerModule {}

@Module({
	imports: [
		...serverModules,
		MongoMemoryDatabaseModule.forRoot({ ...defaultMikroOrmOptions }),
		RabbitMQWrapperTestModule,
		LoggerModule,
	],
})
export class AdminApiServerTestModule {
	static forRoot(options?: MongoDatabaseModuleOptions): DynamicModule {
		return {
			module: AdminApiServerTestModule,
			imports: [
				...serverModules,
				MongoMemoryDatabaseModule.forRoot({ ...defaultMikroOrmOptions, ...options }),
				RabbitMQWrapperTestModule,
			],
		};
	}
}
