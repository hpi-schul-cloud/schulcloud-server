import { AccountEntity } from '@modules/account/domain/entity/account.entity';
import { BoardNodeEntity } from '@modules/board/repo/entity';
import { ClassEntity } from '@modules/class/entity';
import { DeletionLogEntity } from '@modules/deletion/repo/entity/deletion-log.entity';
import { DeletionRequestEntity } from '@modules/deletion/repo/entity/deletion-request.entity';
import { GroupEntity } from '@modules/group/entity';
import { InstanceEntity } from '@modules/instance';
import { ColumnBoardBoardElement, ColumnBoardNode } from '@modules/learnroom/repo';
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
import { Course } from './course.entity';
import { CourseGroup } from './coursegroup.entity';
import { DashboardGridElementModel, DashboardModelEntity } from './dashboard.model.entity';
import { CountyEmbeddable, FederalStateEntity } from './federal-state.entity';
import { LegacyBoard, LegacyBoardElement, LessonBoardElement, TaskBoardElement } from './legacy-board';
import { LessonEntity } from './lesson.entity';
import { LtiTool } from './ltitool.entity';
import { Material } from './materials.entity';
import { CourseNews, News, SchoolNews, TeamNews } from './news.entity';
import { Role } from './role.entity';
import { SchoolEntity, SchoolRolePermission, SchoolRoles } from './school.entity';
import { SchoolYearEntity } from './schoolyear.entity';
import { StorageProviderEntity } from './storageprovider.entity';
import { Submission } from './submission.entity';
import { Task } from './task.entity';
import { TeamEntity, TeamUserEntity } from './team.entity';
import { UserLoginMigrationEntity } from './user-login-migration.entity';
import { User } from './user.entity';
import { VideoConference } from './video-conference.entity';

export const ALL_ENTITIES = [
	AccountEntity,
	LegacyBoard,
	LegacyBoardElement,
	BoardNodeEntity,
	ColumnBoardBoardElement,
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
