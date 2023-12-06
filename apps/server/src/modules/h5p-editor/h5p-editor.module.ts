import { RabbitMQWrapperModule } from '@infra/rabbitmq';
import { S3ClientModule } from '@infra/s3-client';
import { Dictionary, IPrimaryKey } from '@mikro-orm/core';
import { MikroOrmModule, MikroOrmModuleSyncOptions } from '@mikro-orm/nestjs';
import { AuthenticationModule } from '@modules/authentication';
import { AuthorizationReferenceModule } from '@modules/authorization/authorization-reference.module';
import { ClassEntity } from '@modules/class/entity';
import { GroupEntity } from '@modules/group/entity';
import { ExternalToolPseudonymEntity, PseudonymEntity } from '@modules/pseudonym/entity';
import { RegistrationPinEntity } from '@modules/registration-pin/entity';
import { ShareToken } from '@modules/sharing/entity/share-token.entity';
import { ContextExternalToolEntity } from '@modules/tool/context-external-tool/entity';
import { ExternalToolEntity } from '@modules/tool/external-tool/entity';
import { SchoolExternalToolEntity } from '@modules/tool/school-external-tool/entity';
import { UserModule } from '@modules/user';
import { Module, NotFoundException } from '@nestjs/common';
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
import { CoreModule } from '@src/core';
import { Logger } from '@src/core/logger';
import { H5PEditorController } from './controller/h5p-editor.controller';
import { H5PContent, H5pEditorTempFile, InstalledLibrary } from './entity';
import { config, s3ConfigContent, s3ConfigLibraries } from './h5p-editor.config';
import { H5PAjaxEndpointProvider, H5PEditorProvider, H5PPlayerProvider } from './provider';
import { H5PContentRepo, LibraryRepo, TemporaryFileRepo } from './repo';
import { ContentStorage, LibraryStorage, TemporaryFileStorage } from './service';
import { H5PEditorUc } from './uc/h5p.uc';

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
	H5PContent,
	H5pEditorTempFile,
	InstalledLibrary,
];

const defaultMikroOrmOptions: MikroOrmModuleSyncOptions = {
	findOneOrFailHandler: (entityName: string, where: Dictionary | IPrimaryKey) =>
		// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
		new NotFoundException(`The requested ${entityName}: ${where} has not been found.`),
};

const imports = [
	AuthenticationModule,
	AuthorizationReferenceModule,
	CoreModule,
	UserModule,
	RabbitMQWrapperModule,
	MikroOrmModule.forRoot({
		...defaultMikroOrmOptions,
		type: 'mongo',
		// TODO add mongoose options as mongo options (see database.js)
		clientUrl: DB_URL,
		password: DB_PASSWORD,
		user: DB_USERNAME,
		allowGlobalContext: true,
		entities,
	}),
	ConfigModule.forRoot(createConfigModuleOptions(config)),
	S3ClientModule.register([s3ConfigContent, s3ConfigLibraries]),
];

const controllers = [H5PEditorController];

const providers = [
	Logger,
	H5PEditorUc,
	H5PContentRepo,
	LibraryRepo,
	TemporaryFileRepo,
	H5PEditorProvider,
	H5PPlayerProvider,
	H5PAjaxEndpointProvider,
	ContentStorage,
	LibraryStorage,
	TemporaryFileStorage,
];

@Module({
	imports,
	controllers,
	providers,
	exports: [ContentStorage, LibraryStorage],
})
export class H5PEditorModule {}
