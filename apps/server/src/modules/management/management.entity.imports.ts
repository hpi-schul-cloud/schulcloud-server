import { AccountEntity } from '@modules/account/repo';
import { BoardNodeEntity } from '@modules/board/repo/entity';
import { ClassEntity } from '@modules/class/entity';
import { CourseEntity } from '@modules/course/repo/course.entity';
import { CourseGroupEntity } from '@modules/course/repo/coursegroup.entity';
import { DeletionLogEntity } from '@modules/deletion/repo/entity/deletion-log.entity';
import { DeletionRequestEntity } from '@modules/deletion/repo/entity/deletion-request.entity';
import { FileRecordEntity } from '@modules/files-storage/repo';
import { FileEntity } from '@modules/files/entity';
import { GroupEntity } from '@modules/group/entity';
import { InstanceEntity } from '@modules/instance';
import {
	ColumnBoardBoardElement,
	ColumnBoardNode,
	LegacyBoard,
	LegacyBoardElement,
	LessonBoardElement,
	TaskBoardElement,
} from '@modules/learnroom/repo';
import { DashboardEntity, DashboardGridElementEntity } from '@modules/learnroom/repo/mikro-orm/dashboard.entity';
import { SchoolSystemOptionsEntity } from '@modules/legacy-school/entity';
import { LessonEntity, Material } from '@modules/lesson/repo';
import { MediaSourceEntity } from '@modules/media-source/entity';
import { CourseNews, News, SchoolNews, TeamNews } from '@modules/news/repo';
import { OauthSessionTokenEntity } from '@modules/oauth/entity';
import { ExternalToolPseudonymEntity } from '@modules/pseudonym/entity';
import { RegistrationPinEntity } from '@modules/registration-pin/entity';
import { RocketChatUserEntity } from '@modules/rocketchat-user/entity';
import { Role } from '@modules/role/repo';
import { RoomMembershipEntity } from '@modules/room-membership/repo/entity/room-membership.entity';
import { RoomEntity } from '@modules/room/repo/entity';
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

export const ENTITIES = [
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
	CourseEntity,
	CourseGroupEntity,
	CourseNews,
	DashboardGridElementEntity,
	DashboardEntity,
	ExternalToolEntity,
	FileEntity,
	FileRecordEntity,
	FederalStateEntity,
	ImportUser,
	LessonEntity,
	LessonBoardElement,
	Material,
	MediaSourceEntity,
	News,
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
	VideoConferenceEntity,
	GroupEntity,
	RegistrationPinEntity,
	UserLicenseEntity,
	MediaUserLicenseEntity,
	InstanceEntity,
	SchoolLicenseEntity,
	MediaSchoolLicenseEntity,
	OauthSessionTokenEntity,
	LtiDeepLinkTokenEntity,
];

export const TEST_ENTITIES = [...ENTITIES];
