import type { EntityId } from '@shared/domain/types';

export interface LessonParent {
	getStudentIds(): EntityId[];
}
