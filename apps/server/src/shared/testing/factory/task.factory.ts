import { DeepPartial } from 'fishery';
import { Task, ITaskProperties } from '@shared/domain';
import { BaseFactory } from './base.factory';

class TaskFactory extends BaseFactory<Task, ITaskProperties> {
	private(flag = true): this {
		const params: DeepPartial<ITaskProperties> = { private: flag };
		if (flag === true) params.course = undefined;
		return this.params(params);
	}
}

export const taskFactory = TaskFactory.define(Task, ({ sequence }) => {
	return { name: `task #${sequence}` };
});
