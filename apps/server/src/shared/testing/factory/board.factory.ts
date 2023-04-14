import { Board, BoardProps } from '@shared/domain';
import { BaseEntityTestFactory } from './base-entity-test.factory';
import { courseFactory } from './course.factory';

export const boardFactory = BaseEntityTestFactory.define<Board, BoardProps>(Board, () => {
	return {
		references: [],
		course: courseFactory.build(),
	};
});
