import type { SchoolEntity } from '@modules/school/repo';
import type { EntityId } from '@shared/domain/types';

export interface CourseLike {
	school: SchoolEntity;
	id?: EntityId;
	name?: string;
	color?: string;
	isFinished?(): boolean;
	isUserSubstitutionTeacher?(user: unknown): boolean;
	getStudentIds?(): EntityId[];
}

export interface CourseGroupLike {
	id?: EntityId;
	name?: string;
	course: CourseLike;
	getStudentIds?(): EntityId[];
}
