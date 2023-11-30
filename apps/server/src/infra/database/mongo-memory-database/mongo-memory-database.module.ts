import { MikroORM } from '@mikro-orm/core';
import { MikroOrmModule, MikroOrmModuleAsyncOptions } from '@mikro-orm/nestjs';
import { ClassEntity } from '@modules/class/entity';
import { FileEntity } from '@modules/files/entity';
import { GroupEntity } from '@modules/group/entity';
import { ExternalToolPseudonymEntity, PseudonymEntity } from '@modules/pseudonym/entity';
import { RegistrationPinEntity } from '@modules/registration-pin/entity';
import { ShareToken } from '@modules/sharing/entity/share-token.entity';
import { ContextExternalToolEntity } from '@modules/tool/context-external-tool/entity';
import { ExternalToolEntity } from '@modules/tool/external-tool/entity';
import { SchoolExternalToolEntity } from '@modules/tool/school-external-tool/entity';
import { DynamicModule, Inject, Module, OnModuleDestroy } from '@nestjs/common';
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
import _ from 'lodash';
import { MongoDatabaseModuleOptions } from './types';

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

const dbName = () => _.times(20, () => _.random(35).toString(36)).join('');

const createMikroOrmModule = (options: MikroOrmModuleAsyncOptions): DynamicModule => {
	const mikroOrmModule = MikroOrmModule.forRootAsync({
		useFactory: () => {
			// eslint-disable-next-line @typescript-eslint/restrict-template-expressions, no-process-env
			const clientUrl = `${process.env.MONGO_TEST_URI}/${dbName()}`;
			return {
				allowGlobalContext: true, // can be overridden by options
				...options,
				type: 'mongo',
				clientUrl,
			};
		},
	});

	return mikroOrmModule;
};

@Module({})
export class MongoMemoryDatabaseModule implements OnModuleDestroy {
	constructor(@Inject(MikroORM) private orm: MikroORM) {}

	static forRoot(options?: MongoDatabaseModuleOptions): DynamicModule {
		const defaultOptions = {
			entities,
		};
		return {
			module: MongoMemoryDatabaseModule,
			imports: [createMikroOrmModule({ ...defaultOptions, ...options })],
			exports: [MikroOrmModule],
		};
	}

	async onModuleDestroy(): Promise<void> {
		await this.orm.close();
	}
}
