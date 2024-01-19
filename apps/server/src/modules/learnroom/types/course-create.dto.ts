import { CourseFeature } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';

export type CourseCreateDto = {
	id?: EntityId;
	name: string;
	description?: string;
	schoolId: EntityId;
	studentIds?: EntityId[];
	teacherIds?: EntityId[];
	substitutionTeacherIds?: EntityId[];
	startDate?: Date;
	untilDate?: Date;
	createdAt?: Date;
	updatedAt?: Date;
	copyingSince?: Date;
	color?: string;
	features?: CourseFeature[];
	shareToken?: string;
};
