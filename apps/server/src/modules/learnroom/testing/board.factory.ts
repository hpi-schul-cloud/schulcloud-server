import { BoardProps, LegacyBoard } from '@modules/learnroom/repo';
import { BaseFactory } from '@testing/factory/base.factory';
import { courseFactory } from '@testing/factory/course.factory';

export const boardFactory = BaseFactory.define<LegacyBoard, BoardProps>(LegacyBoard, () => {
	return {
		references: [],
		course: courseFactory.build(),
	};
});
