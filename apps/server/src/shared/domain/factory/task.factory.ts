import { Task, ITaskProperties } from '../entity/task.entity';
import { BaseFactory } from './base.factory';

export const taskFactory = BaseFactory.define<Task, ITaskProperties>(Task, ({ sequence }) => {
	return { name: `task #${sequence}` };
});
