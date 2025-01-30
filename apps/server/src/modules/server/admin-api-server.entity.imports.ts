import { ClassEntity } from '@modules/class/entity';
import { DeletionLogEntity, DeletionRequestEntity } from '@modules/deletion/repo/entity';
import { GroupEntity } from '@modules/group/entity';
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
];

export const TEST_ENTITIES = [...ENTITIES];
