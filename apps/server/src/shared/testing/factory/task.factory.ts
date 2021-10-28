import { DeepPartial } from 'fishery';
import { Task, ITaskProperties } from '@shared/domain';
import { BaseFactory } from './base.factory';

class TaskFactory extends BaseFactory<Task, ITaskProperties> {
	draft(isDraft = true): this {
		const params: DeepPartial<ITaskProperties> = { private: isDraft };
		if (isDraft === true) params.course = undefined;
		return this.params(params);
	}
}

export const taskFactory = TaskFactory.define(Task, ({ sequence }) => {
	return { name: `task #${sequence}` };
});
