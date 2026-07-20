import type { SchoolEntity } from '@modules/school/repo';

export interface CourseLike {
	school: SchoolEntity;
}

export interface CourseGroupLike {
	course: CourseLike;
}
