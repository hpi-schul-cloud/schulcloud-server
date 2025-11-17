import { AccountEntity } from '@modules/account/repo';
import { BoardNodeEntity } from '@modules/board/repo/entity';
import { ClassEntity } from '@modules/class/entity';
import { CourseEntity } from '@modules/course/repo/course.entity';
import { CourseGroupEntity } from '@modules/course/repo/coursegroup.entity';
import { DeletionBatchEntity, DeletionLogEntity, DeletionRequestEntity } from '@modules/deletion/repo/entity';
import { GroupEntity } from '@modules/group/entity';
import { InstanceEntity } from '@modules/instance';
import {
	ColumnBoardBoardElement,
	ColumnBoardNode,
	DashboardEntity,
	DashboardGridElementEntity,
	LegacyBoard,
	LegacyBoardElement,
	LessonBoardElement,
	TaskBoardElement,
} from '@modules/learnroom/repo';
import { SchoolSystemOptionsEntity } from '@modules/legacy-school/entity';
import { LessonEntity, Material } from '@modules/lesson/repo';
import { MediaSourceEntity } from '@modules/media-source/entity';
import { CourseNews, News, SchoolNews, TeamNews } from '@modules/news/repo';
import { OauthSessionTokenEntity } from '@modules/oauth/entity';
import { ExternalToolPseudonymEntity } from '@modules/pseudonym/entity';
import { RegistrationEntity } from '@modules/registration';
import { RegistrationPinEntity } from '@modules/registration-pin/entity';
import { RocketChatUserEntity } from '@modules/rocketchat-user/entity';
import { Role } from '@modules/role/repo';
import { RoomMembershipEntity } from '@modules/room-membership/repo/entity/room-membership.entity';
import { RoomEntity, RoomInvitationLinkEntity } from '@modules/room/repo/entity';
import { MediaSchoolLicenseEntity, SchoolLicenseEntity } from '@modules/school-license/entity';
import {
	CountyEmbeddable,
	FederalStateEntity,
	SchoolEntity,
	SchoolRolePermission,
	SchoolRoles,
	SchoolYearEntity,
	StorageProviderEntity,
} from '@modules/school/repo';
import { ShareToken } from '@modules/sharing/entity/share-token.entity';
import { SystemEntity } from '@modules/system/repo';
import { Submission, Task } from '@modules/task/repo';
import { TeamEntity, TeamUserEntity } from '@modules/team/repo';
import { ContextExternalToolEntity, LtiDeepLinkTokenEntity } from '@modules/tool/context-external-tool/repo';
import { ExternalToolEntity } from '@modules/tool/external-tool/repo';
import { SchoolExternalToolEntity } from '@modules/tool/school-external-tool/repo';
import { ImportUser } from '@modules/user-import/entity';
import { MediaUserLicenseEntity, UserLicenseEntity } from '@modules/user-license/entity';
import { UserLoginMigrationEntity } from '@modules/user-login-migration/repo';
import { User } from '@modules/user/repo';
import { VideoConferenceEntity } from '@modules/video-conference/repo';
import { RoomContentEntity } from '@modules/room/repo/entity/room-content.entity';

export const ENTITIES = [
	AccountEntity,
	BoardNodeEntity,
	ClassEntity,
	ColumnBoardBoardElement,
	ColumnBoardNode,
	DeletionRequestEntity,
	DeletionLogEntity,
	DeletionBatchEntity,
	ContextExternalToolEntity,
	CountyEmbeddable,
	CourseEntity,
	CourseGroupEntity,
	CourseNews,
	DashboardGridElementEntity,
	DashboardEntity,
	ExternalToolEntity,
	FederalStateEntity,
	ImportUser,
	LessonEntity,
	LessonBoardElement,
	LegacyBoard,
	LegacyBoardElement,
	Material,
	News,
	ExternalToolPseudonymEntity,
	RegistrationEntity,
	RocketChatUserEntity,
	Role,
	RoomEntity,
	RoomInvitationLinkEntity,
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
	VideoConferenceEntity,
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
	RoomContentEntity,
];

export const TEST_ENTITIES = [...ENTITIES];
