import { MongoMemoryDatabaseModule } from '@infra/database';
import { MongoDatabaseModuleOptions } from '@infra/database/mongo-memory-database/types';
import { Dictionary, IPrimaryKey } from '@mikro-orm/core';
import { MikroOrmModule, MikroOrmModuleSyncOptions } from '@mikro-orm/nestjs';
import { ClassEntity } from '@modules/class/entity';
import { GroupEntity } from '@modules/group/entity';
import { ExternalToolPseudonymEntity, PseudonymEntity } from '@modules/pseudonym/entity';
import { RegistrationPinEntity } from '@modules/registration-pin/entity';
import { ShareToken } from '@modules/sharing/entity/share-token.entity';
import { ContextExternalToolEntity } from '@modules/tool/context-external-tool/entity';
import { ExternalToolEntity } from '@modules/tool/external-tool/entity';
import { SchoolExternalToolEntity } from '@modules/tool/school-external-tool/entity';
import { DynamicModule, Module, NotFoundException } from '@nestjs/common';
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
import { DB_PASSWORD, DB_URL, DB_USERNAME } from '@src/config';
import { ManagementModule } from './management.module';

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
];

export const defaultMikroOrmOptions: MikroOrmModuleSyncOptions = {
	findOneOrFailHandler: (entityName: string, where: Dictionary | IPrimaryKey) =>
		// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
		new NotFoundException(`The requested ${entityName}: ${where} has not been found.`),
};

@Module({
	imports: [
		ManagementModule,
		MikroOrmModule.forRoot({
			...defaultMikroOrmOptions,
			// TODO repeats server module definitions
			type: 'mongo',
			clientUrl: DB_URL,
			password: DB_PASSWORD,
			user: DB_USERNAME,
			entities,
		}),
	],
})
export class ManagementServerModule {}

@Module({
	imports: [ManagementModule, MongoMemoryDatabaseModule.forRoot({ ...defaultMikroOrmOptions })],
})
export class ManagementServerTestModule {
	static forRoot(options?: MongoDatabaseModuleOptions): DynamicModule {
		return {
			module: ManagementModule,
			imports: [MongoMemoryDatabaseModule.forRoot({ ...defaultMikroOrmOptions, ...options })],
		};
	}
}
