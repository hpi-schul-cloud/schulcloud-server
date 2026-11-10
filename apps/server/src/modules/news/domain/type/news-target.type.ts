import type { CourseEntity } from '@modules/course/repo';
import { type SchoolEntity } from '@modules/school/repo';

export type NewsTarget = SchoolEntity | CourseEntity;
