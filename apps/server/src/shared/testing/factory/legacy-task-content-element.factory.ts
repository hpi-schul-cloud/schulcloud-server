import { Task } from '@shared/domain';
import { LegacyTaskContentElement } from '@shared/domain/entity/card.entity';
import { BaseFactory } from './base.factory';
import { taskFactory } from './task.factory';

export const legacyTaskContentElementFactory = BaseFactory.define<LegacyTaskContentElement, { task: Task }>(
	LegacyTaskContentElement,
	() => {
		return {
			task: taskFactory.build(),
		};
	}
);
