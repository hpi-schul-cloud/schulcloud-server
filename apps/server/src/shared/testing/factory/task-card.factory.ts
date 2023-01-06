import { CardType, ITaskCardProps, TaskCard } from '@shared/domain';
import { taskFactory } from '@shared/testing';
import { BaseFactory } from './base.factory';
import { schoolFactory } from './school.factory';
import { userFactory } from './user.factory';

const yesterday = new Date(Date.now() - 86400000);

class TaskCardFactory extends BaseFactory<TaskCard, ITaskCardProps> {}

export const taskCardFactory = TaskCardFactory.define(TaskCard, ({ sequence }) => {
	const task = taskFactory.buildWithId();
	const school = schoolFactory.build();
	const creator = userFactory.build({ school });
	const cardElements = [];
	// private is by default in constructor true, but in the most test cases we need private: false
	return {
		name: `task card #${sequence}`,
		private: false,
		cardType: CardType.Task,
		cardElements,
		draggable: true,
		creator,
		task,
	};
});
