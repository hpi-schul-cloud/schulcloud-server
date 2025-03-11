import type { CourseEntity } from '@modules/course/repo';
import { SchoolEntity } from '@modules/school/repo';
import type { TeamEntity } from '@modules/team/repo';

export type NewsTarget = SchoolEntity | TeamEntity | CourseEntity;
