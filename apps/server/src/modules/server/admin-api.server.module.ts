import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ClassEntity } from '@modules/class/entity';
import { FileEntity } from '@modules/files/entity';
import { GroupEntity } from '@modules/group/entity';
import { ExternalToolPseudonymEntity, PseudonymEntity } from '@modules/pseudonym/entity';
import { RegistrationPinEntity } from '@modules/registration-pin/entity';
import { ShareToken } from '@modules/sharing/entity/share-token.entity';
import { ContextExternalToolEntity } from '@modules/tool/context-external-tool/entity';
import { ExternalToolEntity } from '@modules/tool/external-tool/entity';
import { SchoolExternalToolEntity } from '@modules/tool/school-external-tool/entity';
import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
	Account,
	Board,
	BoardElement,
	BoardNode,
	CardNode,
	ColumnboardBoardElement,
	ColumnBoardNode,
	ColumnBoardTarget,
	ColumnNode,
	Course,
	CourseGroup,
	CourseNews,
	DashboardGridElementModel,
	DashboardModelEntity,
	ExternalToolElementNodeEntity,
	FederalStateEntity,
	FileElementNode,
	ImportUser,
	LessonBoardElement,
	LessonEntity,
	LinkElementNode,
	LtiTool,
	Material,
	News,
	RichTextElementNode,
	Role,
	SchoolEntity,
	SchoolNews,
	SchoolRolePermission,
	SchoolRoles,
	SchoolYearEntity,
	StorageProviderEntity,
	Submission,
	SubmissionContainerElementNode,
	SubmissionItemNode,
	SystemEntity,
	Task,
	TaskBoardElement,
	TeamEntity,
	TeamNews,
	TeamUserEntity,
	User,
	UserLoginMigrationEntity,
	VideoConference,
} from '@shared/domain/entity';
import { createConfigModuleOptions, DB_PASSWORD, DB_URL, DB_USERNAME } from '@src/config';
import { LoggerModule } from '@src/core/logger';
import { MongoDatabaseModuleOptions, MongoMemoryDatabaseModule } from '@src/infra/database';
import { RabbitMQWrapperModule, RabbitMQWrapperTestModule } from '@src/infra/rabbitmq';
import { DeletionApiModule } from '../deletion/deletion-api.module';
import { serverConfig } from './server.config';
import { defaultMikroOrmOptions } from './server.module';

const entities = [
	Account,
	Board,
	BoardElement,
	BoardNode,
	CardNode,
	ColumnboardBoardElement,
	ColumnBoardNode,
	ColumnBoardTarget,
	ColumnNode,
	ClassEntity,
	FileElementNode,
	LinkElementNode,
	RichTextElementNode,
	SubmissionContainerElementNode,
	SubmissionItemNode,
	ExternalToolElementNodeEntity,
	Course,
	ContextExternalToolEntity,
	CourseGroup,
	CourseNews,
	DashboardGridElementModel,
	DashboardModelEntity,
	ExternalToolEntity,
	FederalStateEntity,
	ImportUser,
	LessonEntity,
	LessonBoardElement,
	LtiTool,
	Material,
	News,
	PseudonymEntity,
	ExternalToolPseudonymEntity,
	Role,
	SchoolEntity,
	SchoolExternalToolEntity,
	SchoolNews,
	SchoolRolePermission,
	SchoolRoles,
	SchoolYearEntity,
	ShareToken,
	StorageProviderEntity,
	Submission,
	SystemEntity,
	Task,
	TaskBoardElement,
	TeamEntity,
	TeamNews,
	TeamUserEntity,
	User,
	UserLoginMigrationEntity,
	VideoConference,
	GroupEntity,
	RegistrationPinEntity,
	FileEntity,
];

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
			entities,
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
