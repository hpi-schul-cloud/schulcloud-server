import { type EntityId } from '@shared/domain/types';
import { type CourseStatus } from './course-status.enum';

export interface CourseFilter {
	schoolId?: EntityId;
	status?: CourseStatus;
	withoutTeacher?: boolean;
}
