import { AccountEntity } from '@modules/account/domain/entity/account.entity';
import { BoardNodeEntity } from '@modules/board/repo';
import { ClassEntity } from '@modules/class/entity';
import { CourseEntity, CourseGroupEntity } from '@modules/course/repo';
import { DeletionLogEntity, DeletionRequestEntity } from '@modules/deletion/repo/entity';
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
import {
	CourseNews,
	News,
	Role,
	SchoolNews,
	StorageProviderEntity,
	TeamEntity,
	TeamNews,
	User,
} from '@shared/domain/entity';

export const ENTITIES = [
	AccountEntity,
	Role,
	DeletionRequestEntity,
	DeletionLogEntity,
	SchoolEntity,
	SchoolYearEntity,
	StorageProviderEntity,
	FederalStateEntity,
	User,
	CourseEntity,
	CourseGroupEntity,
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
];

export const TEST_ENTITIES = [...ENTITIES];
