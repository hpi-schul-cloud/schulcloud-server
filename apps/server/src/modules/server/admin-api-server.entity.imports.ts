import { AccountEntity } from '@modules/account/domain/entity/account.entity';
import { BoardNodeEntity } from '@modules/board/repo';
import { ClassEntity } from '@modules/class/entity';
import { DeletionBatchEntity, DeletionLogEntity, DeletionRequestEntity } from '@modules/deletion/repo/entity';
import { FileEntity } from '@modules/files/entity';
import { GroupEntity } from '@modules/group/entity';
import { ExternalToolPseudonymEntity } from '@modules/pseudonym/entity';
import { RegistrationPinEntity } from '@modules/registration-pin/entity';
import { RocketChatUserEntity } from '@modules/rocketchat-user/entity';
import { RoomMembershipEntity } from '@modules/room-membership';
import { FederalStateEntity, SchoolEntity, SchoolYearEntity } from '@modules/school/repo';
import { ContextExternalToolEntity, LtiDeepLinkTokenEntity } from '@modules/tool/context-external-tool/repo';
import { ExternalToolEntity } from '@modules/tool/external-tool/repo';
import { SchoolExternalToolEntity } from '@modules/tool/school-external-tool/repo';
import { User } from '@modules/user/repo';
import { DashboardEntity, DashboardGridElementEntity } from '@modules/learnroom/repo/mikro-orm/dashboard.entity';

import {
	Course,
	CourseGroup,
	CourseNews,
	News,
	Role,
	SchoolNews,
	StorageProviderEntity,
	TeamEntity,
	TeamNews,
	Task,
	Submission,
	LessonEntity,
	Material,
} from '@shared/domain/entity';

export const ENTITIES = [
	AccountEntity,
	Role,
	DeletionRequestEntity,
	DeletionLogEntity,
	DeletionBatchEntity,
	SchoolEntity,
	SchoolYearEntity,
	StorageProviderEntity,
	FederalStateEntity,
	User,
	Course,
	CourseGroup,
	ClassEntity,
	GroupEntity,
	ExternalToolEntity,
	ContextExternalToolEntity,
	SchoolExternalToolEntity,
	FileEntity,
	CourseNews,
	News,
	SchoolNews,
	TeamNews,
	TeamEntity,
	ExternalToolPseudonymEntity,
	RocketChatUserEntity,
	RegistrationPinEntity,
	LtiDeepLinkTokenEntity,
	BoardNodeEntity,
	RoomMembershipEntity,
	Task,
	Submission,
	DashboardEntity,
	DashboardGridElementEntity,
	LessonEntity,
	Material,
];

export const TEST_ENTITIES = [...ENTITIES];
