import { SingleColumnBoard, SingleColumnBoardProps } from '@shared/domain';
import { BaseFactory } from './base.factory';
import { courseFactory } from './course.factory';

export const singleColumnBoardFactory = BaseFactory.define<SingleColumnBoard, SingleColumnBoardProps>(
	SingleColumnBoard,
	() => {
		return {
			references: [],
			course: courseFactory.build(),
		};
	}
);
