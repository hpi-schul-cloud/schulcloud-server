import { ComponentProperties } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';

export type LessonCreateDto = {
	id?: EntityId;
	name: string;
	hidden?: boolean;
	courseId: EntityId;
	// courseGroup?: CourseGroup;
	position?: number;
	contents?: ComponentProperties[] | [];
	materialIds?: EntityId[];
	taskIds?: EntityId[];
};
