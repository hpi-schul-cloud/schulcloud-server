import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { DB_PASSWORD, DB_URL, DB_USERNAME } from '@src/imports-from-feathers';
import { ConsoleWriterModule } from '@infra/console/console-writer/console-writer.module';
import { KeycloakModule } from '@infra/identity-management/keycloak/keycloak.module';
import { SyncModule } from '@infra/sync/sync.module';
import { MikroOrmModule, MikroOrmModuleSyncOptions } from '@mikro-orm/nestjs';
import { FilesModule } from '@modules/files';
import { ManagementModule } from '@modules/management/management.module';
import { serverConfig } from '@modules/server';
import { Module } from '@nestjs/common'; // TODO: Import Reihenfolge sieht falsch aus ...IDM prüfen.
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@shared/common';
import { ConsoleModule } from 'nestjs-console';
import path from 'path';
import { AccountEntity } from '@modules/account/domain/entity/account.entity';
import { BoardNodeEntity } from '@modules/board/repo/entity';
import { ClassEntity } from '@modules/class/entity';
import { DeletionLogEntity } from '@modules/deletion/repo/entity/deletion-log.entity';
import { DeletionRequestEntity } from '@modules/deletion/repo/entity/deletion-request.entity';
import { GroupEntity } from '@modules/group/entity';
import { InstanceEntity } from '@modules/instance';
import { SchoolSystemOptionsEntity } from '@modules/legacy-school/entity';
import { MediaSourceEntity } from '@modules/media-source/entity';
import { OauthSessionTokenEntity } from '@modules/oauth/entity';
import { ExternalToolPseudonymEntity, PseudonymEntity } from '@modules/pseudonym/entity';
import { RegistrationPinEntity } from '@modules/registration-pin/entity';
import { RocketChatUserEntity } from '@modules/rocketchat-user/entity';
import { RoomMembershipEntity } from '@modules/room-membership/repo/entity/room-membership.entity';
import { RoomEntity } from '@modules/room/repo/entity';
import { MediaSchoolLicenseEntity, SchoolLicenseEntity } from '@modules/school-license/entity';
import { ShareToken } from '@modules/sharing/entity/share-token.entity';
import { SystemEntity } from '@modules/system/entity/system.entity';
import { ContextExternalToolEntity, LtiDeepLinkTokenEntity } from '@modules/tool/context-external-tool/entity';
import { ExternalToolEntity } from '@modules/tool/external-tool/entity';
import { SchoolExternalToolEntity } from '@modules/tool/school-external-tool/entity';
import { ImportUser } from '@modules/user-import/entity';
import { MediaUserLicenseEntity, UserLicenseEntity } from '@modules/user-license/entity';
import { ColumnBoardNode } from '@shared/domain/entity/column-board-node.entity';
import { Course } from '@shared/domain/entity/course.entity';
import { CourseGroup } from '@shared/domain/entity/coursegroup.entity';
import { DashboardGridElementModel, DashboardModelEntity } from '@shared/domain/entity/dashboard.model.entity';
import { CountyEmbeddable, FederalStateEntity } from '@shared/domain/entity/federal-state.entity';
import {
	ColumnboardBoardElement,
	LegacyBoard,
	LegacyBoardElement,
	LessonBoardElement,
	TaskBoardElement,
} from '@shared/domain/entity/legacy-board';
import { LessonEntity } from '@shared/domain/entity/lesson.entity';
import { LtiTool } from '@shared/domain/entity/ltitool.entity';
import { Material } from '@shared/domain/entity/materials.entity';
import { CourseNews, News, SchoolNews, TeamNews } from '@shared/domain/entity/news.entity';
import { Role } from '@shared/domain/entity/role.entity';
import { SchoolEntity, SchoolRolePermission, SchoolRoles } from '@shared/domain/entity/school.entity';
import { SchoolYearEntity } from '@shared/domain/entity/schoolyear.entity';
import { StorageProviderEntity } from '@shared/domain/entity/storageprovider.entity';
import { Submission } from '@shared/domain/entity/submission.entity';
import { Task } from '@shared/domain/entity/task.entity';
import { TeamEntity, TeamUserEntity } from '@shared/domain/entity/team.entity';
import { UserLoginMigrationEntity } from '@shared/domain/entity/user-login-migration.entity';
import { User } from '@shared/domain/entity/user.entity';
import { VideoConference } from '@shared/domain/entity/video-conference.entity';
import { ServerConsole } from './server.console';

export const ENTITIES = [
	AccountEntity,
	LegacyBoard,
	LegacyBoardElement,
	BoardNodeEntity,
	ColumnboardBoardElement,
	ColumnBoardNode,
	ClassEntity,
	DeletionRequestEntity,
	DeletionLogEntity,
	ContextExternalToolEntity,
	CountyEmbeddable,
	Course,
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
	RocketChatUserEntity,
	Role,
	RoomEntity,
	RoomMembershipEntity,
	SchoolEntity,
	SchoolExternalToolEntity,
	SchoolNews,
	SchoolRolePermission,
	SchoolRoles,
	SchoolSystemOptionsEntity,
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
	UserLicenseEntity,
	MediaUserLicenseEntity,
	InstanceEntity,
	MediaSourceEntity,
	SchoolLicenseEntity,
	MediaSchoolLicenseEntity,
	OauthSessionTokenEntity,
	LtiDeepLinkTokenEntity,
];

const migrationsPath = path.resolve(__dirname, '..', 'migrations', 'mikro-orm'); // TODO: Warum ist das hier überhaupt relevant?

const mikroOrmCliConfig: MikroOrmModuleSyncOptions = {
	// TODO repeats server module definitions
	type: 'mongo',
	clientUrl: DB_URL,
	password: DB_PASSWORD,
	user: DB_USERNAME,
	entities: [...ENTITIES],
	allowGlobalContext: true,
	// TODO: Warum kann das raus? Das sollte doch nicht auskommentiert sein. Warum ist das überhaupt hier alles seperiert?
	/*
	findOneOrFailHandler: (entityName: string, where: Dictionary | IPrimaryKey) =>
		new NotFoundException(`The requested ${entityName}: ${JSON.stringify(where)} has not been found.`),
	*/
	// TODO: Warum kann das raus?
	migrations: {
		tableName: 'migrations', // name of database table with log of executed transactions
		path: migrationsPath, // path to the folder with migrations
		pathTs: migrationsPath, // path to the folder with TS migrations (if used, we should put path to compiled files in `path`)
		glob: '!(*.d).{js,ts}', // how to match migration files (all .js and .ts files, but not .d.ts)
		transactional: false, // wrap each migration in a transaction
		disableForeignKeys: true, // wrap statements with `set foreign_key_checks = 0` or equivalent
		allOrNothing: false, // wrap all migrations in master transaction
		dropTables: false, // allow to disable table dropping
		safe: false, // allow to disable table and column dropping
		snapshot: true, // save snapshot when creating new migrations
		emit: 'ts', // migration generation mode
		// generator: TSMigrationGenerator, // migration generator, e.g. to allow custom formatting
	},
};

@Module({
	imports: [
		ManagementModule,
		ConsoleModule,
		ConsoleWriterModule,
		FilesModule, // TODO: Warum brauchen wir das hier?
		ConfigModule.forRoot(createConfigModuleOptions(serverConfig)),
		...((Configuration.get('FEATURE_IDENTITY_MANAGEMENT_ENABLED') as boolean) ? [KeycloakModule] : []), // TODO: Was macht das KeycloakModule hier?
		MikroOrmModule.forRoot(mikroOrmCliConfig),
		SyncModule, // TODO: Warum brauchen wir das hier?
	],
	providers: [
		/** add console services as providers */
		ServerConsole,
	],
})
export class ServerConsoleModule {}
