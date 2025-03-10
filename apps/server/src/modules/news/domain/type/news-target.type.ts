import type { CourseEntity } from '@modules/course/repo';
import { SchoolEntity } from '@modules/school/repo';
import type { TeamEntity } from '@shared/domain/entity/team.entity';

export type NewsTarget = SchoolEntity | TeamEntity | CourseEntity;
