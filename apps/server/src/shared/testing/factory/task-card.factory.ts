import { CardType, ITaskCardProps, TaskCard } from '@shared/domain';
import { BaseFactory } from './base.factory';
import { schoolFactory } from './school.factory';
import { taskFactory } from './task.factory';
import { userFactory } from './user.factory';

class TaskCardFactory extends BaseFactory<TaskCard, ITaskCardProps> {}

export const taskCardFactory = TaskCardFactory.define(TaskCard, () => {
	const task = taskFactory.buildWithId();
	const school = schoolFactory.build();
	const creator = userFactory.build({ school });
	return {
		cardType: CardType.Task,
		draggable: true,
		creator,
		task,
		cardElements: [],
	};
});
