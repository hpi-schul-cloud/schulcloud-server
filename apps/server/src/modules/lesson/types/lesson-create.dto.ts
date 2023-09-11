import { EntityId, IComponentProperties } from '@shared/domain';

export type LessonCreateDto = {
	id?: EntityId;
	name: string;
	hidden?: boolean;
	courseId: EntityId;
	// courseGroup?: CourseGroup;
	position?: number;
	contents?: IComponentProperties[] | [];
	materialIds?: EntityId[];
	taskIds?: EntityId[];
};
