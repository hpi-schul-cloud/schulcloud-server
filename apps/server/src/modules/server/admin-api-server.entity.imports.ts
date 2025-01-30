import { AccountEntity } from '@modules/account/domain/entity/account.entity';
import { ClassEntity } from '@modules/class/entity';
import { DeletionLogEntity, DeletionRequestEntity } from '@modules/deletion/repo/entity';
import { GroupEntity } from '@modules/group/entity';
import { ContextExternalToolEntity } from '@modules/tool/context-external-tool/entity';
import { ExternalToolEntity } from '@modules/tool/external-tool/entity';
import { SchoolExternalToolEntity } from '@modules/tool/school-external-tool/entity';
import {
	Course,
	CourseGroup,
	FederalStateEntity,
	Role,
	SchoolEntity,
	SchoolYearEntity,
	StorageProviderEntity,
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
	Course,
	CourseGroup,
	ClassEntity,
	GroupEntity,
	ExternalToolEntity,
	ContextExternalToolEntity,
	SchoolExternalToolEntity,
];

export const TEST_ENTITIES = [...ENTITIES];
