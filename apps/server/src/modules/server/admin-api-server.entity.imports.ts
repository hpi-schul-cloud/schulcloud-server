import { AccountEntity } from '@modules/account/repo';
import { BoardNodeEntity } from '@modules/board/repo';
import { ClassEntity } from '@modules/class/entity';
import { CourseEntity, CourseGroupEntity } from '@modules/course/repo';
import { DeletionBatchEntity, DeletionLogEntity, DeletionRequestEntity } from '@modules/deletion/repo/entity';
import { FileEntity } from '@modules/files/entity';
import { GroupEntity } from '@modules/group/entity';
import { DashboardEntity, DashboardGridElementEntity } from '@modules/learnroom/repo/mikro-orm/dashboard.entity';
import { SchoolSystemOptionsEntity } from '@modules/legacy-school/entity';
import { LessonEntity, Material } from '@modules/lesson/repo';
import { CourseNews, News, SchoolNews, TeamNews } from '@modules/news/repo';
import { ExternalToolPseudonymEntity } from '@modules/pseudonym/entity';
import { RegistrationPinEntity } from '@modules/registration-pin/entity';
import { Role } from '@modules/role/repo';
import { RoomArrangementEntity } from '@modules/room';
import { RoomMembershipEntity } from '@modules/room-membership';
import { FederalStateEntity, SchoolEntity, SchoolYearEntity, StorageProviderEntity } from '@modules/school/repo';
import { Submission, Task } from '@modules/task/repo';
import { TeamEntity } from '@modules/team/repo';
import { ContextExternalToolEntity, LtiDeepLinkTokenEntity } from '@modules/tool/context-external-tool/repo';
import { ExternalToolEntity } from '@modules/tool/external-tool/repo';
import { SchoolExternalToolEntity } from '@modules/tool/school-external-tool/repo';
import { UserLoginMigrationEntity } from '@modules/user-login-migration/repo';
import { User } from '@modules/user/repo';

export const ENTITIES = [
	AccountEntity,
	BoardNodeEntity,
	ClassEntity,
	ContextExternalToolEntity,
	CourseEntity,
	CourseGroupEntity,
	CourseNews,
	DashboardEntity,
	DashboardGridElementEntity,
	DeletionBatchEntity,
	DeletionLogEntity,
	DeletionRequestEntity,
	ExternalToolEntity,
	ExternalToolPseudonymEntity,
	FederalStateEntity,
	FileEntity,
	GroupEntity,
	LessonEntity,
	LtiDeepLinkTokenEntity,
	Material,
	News,
	RegistrationPinEntity,
	Role,
	RoomArrangementEntity,
	RoomMembershipEntity,
	SchoolEntity,
	SchoolExternalToolEntity,
	SchoolNews,
	SchoolSystemOptionsEntity,
	SchoolYearEntity,
	StorageProviderEntity,
	Submission,
	Task,
	TeamEntity,
	TeamNews,
	User,
	UserLoginMigrationEntity,
];

export const TEST_ENTITIES = [...ENTITIES];
