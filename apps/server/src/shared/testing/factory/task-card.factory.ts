import { CardType, ITaskCardProps, TaskCard } from '@shared/domain';
import { BaseFactory } from './base.factory';
import { courseFactory } from './course.factory';
import { schoolFactory } from './school.factory';
import { taskFactory } from './task.factory';
import { userFactory } from './user.factory';

class TaskCardFactory extends BaseFactory<TaskCard, ITaskCardProps> {}

export const taskCardFactory = TaskCardFactory.define(TaskCard, () => {
	const task = taskFactory.buildWithId();
	const school = schoolFactory.build();
	const creator = userFactory.build({ school });
	const tomorrow = new Date(Date.now() + 86400000);
	const inTwoDays = new Date(Date.now() + 172800000);
	const course = courseFactory.buildWithId();
	return {
		cardType: CardType.Task,
		draggable: true,
		creator,
		task,
		cardElements: [],
		visibleAtDate: tomorrow,
		dueDate: inTwoDays,
		title: 'Task Card Title',
		course,
		completed: [],
	};
});
