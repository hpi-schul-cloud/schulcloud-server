import { Task, ITaskProperties } from '../entity/task.entity';
import { BaseFactory } from './base.factory';

class TaskFactory extends BaseFactory<Task, ITaskProperties> {
	draft(flag = true): this {
		return this.params({ private: flag });
	}
}

export const taskFactory = TaskFactory.define(Task, ({ sequence }) => {
	return { name: `task #${sequence}` };
});
