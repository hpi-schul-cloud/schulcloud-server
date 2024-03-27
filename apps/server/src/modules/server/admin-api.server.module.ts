import { MikroOrmModule } from '@mikro-orm/nestjs';
import { DynamicModule, Module } from '@nestjs/common';
// import { ALL_ENTITIES } from '@shared/domain';
import { FileEntity } from '@modules/files/entity';
import { ConfigModule } from '@nestjs/config';
import { ALL_ENTITIES } from '@shared/domain/entity';
import { DB_PASSWORD, DB_URL, DB_USERNAME, createConfigModuleOptions } from '@src/config';
import { LoggerModule } from '@src/core/logger';
import { MongoDatabaseModuleOptions, MongoMemoryDatabaseModule } from '@src/infra/database';
import { RabbitMQWrapperModule, RabbitMQWrapperTestModule } from '@src/infra/rabbitmq';
import { MongoDriver } from '@mikro-orm/mongodb';
import { DeletionApiModule } from '../deletion/deletion-api.module';
import { serverConfig } from './server.config';
import { defaultMikroOrmOptions } from './server.module';
import { LegacySchoolAdminApiModule } from '../legacy-school/legacy-school-admin.api-module';
import { UserAdminApiModule } from '../user/user-admin-api.module';

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
			driver: MongoDriver,
			clientUrl: DB_URL,
			password: DB_PASSWORD,
			user: DB_USERNAME,
			entities: [...ALL_ENTITIES, FileEntity],
			debug: true,
		}),
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
