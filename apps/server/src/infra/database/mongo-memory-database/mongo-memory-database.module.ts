import { MikroORM } from '@mikro-orm/core';
import { MikroOrmModule, MikroOrmModuleAsyncOptions } from '@mikro-orm/nestjs';
import { DynamicModule, Inject, Module, OnModuleDestroy } from '@nestjs/common';
import _ from 'lodash';
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
import { MongoDatabaseModuleOptions } from './types';

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
			entities: ENTITIES,
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
