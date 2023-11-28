import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { Dictionary, IPrimaryKey } from '@mikro-orm/core';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module, NotFoundException } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConsoleWriterModule } from '@infra/console';
import { KeycloakModule } from '@infra/identity-management';
import { DB_PASSWORD, DB_URL, DB_USERNAME, createConfigModuleOptions } from '@src/config';
import { FilesModule } from '@modules/files';
import { ManagementModule } from '@modules/management';
import { serverConfig } from '@modules/server';
import { ConsoleModule } from 'nestjs-console';
import { FileEntity } from '@modules/files/entity';
import { FileRecord } from '@modules/files-storage/entity';
import { ClassEntity } from '@modules/class/entity';
import { GroupEntity } from '@modules/group/entity';
import { ExternalToolPseudonymEntity, PseudonymEntity } from '@modules/pseudonym/entity';
import { ShareToken } from '@modules/sharing/entity/share-token.entity';
import { ContextExternalToolEntity } from '@modules/tool/context-external-tool/entity';
import { ExternalToolEntity } from '@modules/tool/external-tool/entity';
import { SchoolExternalToolEntity } from '@modules/tool/school-external-tool/entity';
import { RegistrationPinEntity } from '@modules/registration-pin/entity';
import {
	Account,
	BoardNode,
	CardNode,
	ColumnBoardNode,
	ColumnNode,
	ExternalToolElementNodeEntity,
	FileElementNode,
	LinkElementNode,
	RichTextElementNode,
	SubmissionContainerElementNode,
	SubmissionItemNode,
	Course,
	CourseGroup,
	DashboardGridElementModel,
	DashboardModelEntity,
	FederalStateEntity,
	ImportUser,
	Board,
	BoardElement,
	ColumnboardBoardElement,
	ColumnBoardTarget,
	LessonBoardElement,
	TaskBoardElement,
	LessonEntity,
	LtiTool,
	Material,
	CourseNews,
	News,
	SchoolNews,
	TeamNews,
	Role,
	SchoolEntity,
	SchoolRolePermission,
	SchoolRoles,
	SchoolYearEntity,
	StorageProviderEntity,
	Submission,
	SystemEntity,
	Task,
	TeamEntity,
	TeamUserEntity,
	UserLoginMigrationEntity,
	User,
	VideoConference,
} from '@shared/domain/entity';
import { ServerConsole } from './server.console';

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
	FileRecord, // why is this added?
];

@Module({
	imports: [
		ManagementModule,
		ConsoleModule,
		ConsoleWriterModule,
		FilesModule,
		ConfigModule.forRoot(createConfigModuleOptions(serverConfig)),
		...((Configuration.get('FEATURE_IDENTITY_MANAGEMENT_ENABLED') as boolean) ? [KeycloakModule] : []),
		MikroOrmModule.forRoot({
			// TODO repeats server module definitions
			type: 'mongo',
			clientUrl: DB_URL,
			password: DB_PASSWORD,
			user: DB_USERNAME,
			entities,
			allowGlobalContext: true,
			findOneOrFailHandler: (entityName: string, where: Dictionary | IPrimaryKey) =>
				new NotFoundException(`The requested ${entityName}: ${JSON.stringify(where)} has not been found.`),
		}),
	],
	providers: [
		/** add console services as providers */
		ServerConsole,
	],
})
export class ServerConsoleModule {}
