import { EntityId } from '@shared/domain/types';
import { CourseStatus } from './course-status.enum';

export interface CourseFilter {
	schoolId?: EntityId;
	status?: CourseStatus;
}
