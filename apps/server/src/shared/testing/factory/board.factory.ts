import { Board, BoardProps } from '@shared/domain';
import { BaseFactory } from './base.factory';
import { courseFactory } from './course.factory';

export const boardFactory = BaseFactory.define<Board, BoardProps>(Board, () => {
	return {
		references: [],
		course: courseFactory.build(),
	};
});
