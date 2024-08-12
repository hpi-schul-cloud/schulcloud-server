import { Configuration } from '@hpi-schul-cloud/commons';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { DeletionApiModule } from '@modules/deletion/deletion-api.module';
import { FileEntity } from '@modules/files/entity';
import { LegacySchoolAdminApiModule } from '@modules/legacy-school/legacy-school-admin.api-module';
import { ToolAdminApiModule } from '@modules/tool/tool-admin-api.module';
import { UserAdminApiModule } from '@modules/user/user-admin-api.module';
import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { ALL_ENTITIES } from '@shared/domain/entity';
import { createConfigModuleOptions, DB_PASSWORD, DB_URL, DB_USERNAME } from '@src/config';
import { LoggerModule } from '@src/core/logger';
import { MongoDatabaseModuleOptions, MongoMemoryDatabaseModule } from '@src/infra/database';
import { EtherpadClientModule } from '@src/infra/etherpad-client';
import { RabbitMQWrapperModule, RabbitMQWrapperTestModule } from '@src/infra/rabbitmq';
import { AdminApiRegistrationPinModule } from '../registration-pin/admin-api-registration-pin.module';
import { serverConfig } from './server.config';
import { defaultMikroOrmOptions } from './server.module';

const serverModules = [
	ConfigModule.forRoot(createConfigModuleOptions(serverConfig)),
	DeletionApiModule,
	LegacySchoolAdminApiModule,
	UserAdminApiModule,
	AdminApiRegistrationPinModule,
	ToolAdminApiModule,
	EtherpadClientModule.register({
		apiKey: Configuration.has('ETHERPAD__API_KEY') ? (Configuration.get('ETHERPAD__API_KEY') as string) : undefined,
		basePath: Configuration.has('ETHERPAD__URI') ? (Configuration.get('ETHERPAD__URI') as string) : undefined,
	}),
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
