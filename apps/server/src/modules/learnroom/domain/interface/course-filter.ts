import { EntityId } from '@shared/domain/types';
import { CourseStatusQueryType } from './course-status-query-type.enum';

export interface CourseFilter {
	schoolId?: EntityId;
	courseStatusQueryType?: CourseStatusQueryType;
}
