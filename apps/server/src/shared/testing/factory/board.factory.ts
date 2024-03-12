import { LegacyBoard, BoardProps } from '@shared/domain/entity';
import { BaseFactory } from './base.factory';
import { courseFactory } from './course.factory';

export const boardFactory = BaseFactory.define<LegacyBoard, BoardProps>(LegacyBoard, () => {
	return {
		references: [],
		course: courseFactory.build(),
	};
});
