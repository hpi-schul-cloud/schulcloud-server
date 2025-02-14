import { BaseFactory } from '@testing/factory/base.factory';
import { courseFactory } from '@testing/factory/course.factory';
import { LegacyBoard, BoardProps } from '../repo';

export const boardFactory = BaseFactory.define<LegacyBoard, BoardProps>(LegacyBoard, () => {
	return {
		references: [],
		course: courseFactory.build(),
	};
});
