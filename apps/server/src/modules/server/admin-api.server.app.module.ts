import { LoggerModule } from '@core/logger';
import { ValidationModule } from '@core/validation';
import { Configuration } from '@hpi-schul-cloud/commons';
import { DB_PASSWORD, DB_URL, DB_USERNAME } from '@imports-from-feathers';
import { AuthGuardModule, AuthGuardOptions } from '@infra/auth-guard';
import { EtherpadClientModule } from '@infra/etherpad-client';
import { RabbitMQWrapperModule, RabbitMQWrapperTestModule } from '@infra/rabbitmq';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { DeletionApiModule } from '@modules/deletion/deletion-api.module';
import { LegacySchoolAdminApiModule } from '@modules/legacy-school/legacy-school-admin.api-module';
import { AdminApiRegistrationPinModule } from '@modules/registration-pin/admin-api-registration-pin.module';
import { ToolAdminApiModule } from '@modules/tool/tool-admin-api.module';
import { UserAdminApiModule } from '@modules/user/user-admin-api.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { createConfigModuleOptions } from '@shared/common/config-module-options';
import { defaultMikroOrmOptions } from '@shared/common/defaultMikroOrmOptions';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { adminApiServerConfig } from './admin-api-server.config';
import { ENTITIES, TEST_ENTITIES } from './admin-api-server.entity.imports';
import { TeamApiModule } from '../team/team-api.module';
import { LearnroomApiModule } from '../learnroom/learnroom-api.module';

const serverModules = [
	ConfigModule.forRoot(createConfigModuleOptions(adminApiServerConfig)),
	ValidationModule,
	DeletionApiModule,
	LegacySchoolAdminApiModule,
	UserAdminApiModule,
	AdminApiRegistrationPinModule,
	ToolAdminApiModule,
	EtherpadClientModule.register({
		apiKey: Configuration.has('ETHERPAD__API_KEY') ? (Configuration.get('ETHERPAD__API_KEY') as string) : undefined,
		basePath: Configuration.has('ETHERPAD__URI') ? (Configuration.get('ETHERPAD__URI') as string) : undefined,
	}),
	AuthGuardModule.register([AuthGuardOptions.X_API_KEY]),
	TeamApiModule,
	LearnroomApiModule,
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
			entities: ENTITIES,
			// debug: true, // use it for locally debugging of queries
		}),
		CqrsModule,
		LoggerModule,
	],
})
export class AdminApiServerModule {}

@Module({
	imports: [
		...serverModules,
		MongoMemoryDatabaseModule.forRoot({ ...defaultMikroOrmOptions, entities: TEST_ENTITIES }),
		RabbitMQWrapperTestModule,
		LoggerModule,
	],
})
export class AdminApiServerTestModule {}
