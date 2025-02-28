import { courseEntityFactory } from '@modules/course/testing';
import { BaseFactory } from '@testing/factory/base.factory';
import { BoardProps, LegacyBoard } from '../repo';

export const boardFactory = BaseFactory.define<LegacyBoard, BoardProps>(LegacyBoard, () => {
	return {
		references: [],
		course: courseEntityFactory.build(),
	};
});
