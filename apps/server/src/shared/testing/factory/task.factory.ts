import { DeepPartial } from 'fishery';
import { Task, ITaskProperties } from '@shared/domain';
import type { User } from '@shared/domain/entity';
import { BaseFactory } from './base.factory';

class TaskFactory extends BaseFactory<Task, ITaskProperties> {
	draft(isDraft = true): this {
		const params: DeepPartial<ITaskProperties> = { private: isDraft };
		if (isDraft === true) params.course = undefined;
		return this.params(params);
	}

	finished(user: User): this {
		const params: DeepPartial<ITaskProperties> = { closed: [user] };
		return this.params(params);
	}
}

export const taskFactory = TaskFactory.define(Task, ({ sequence }) => {
	return { name: `task #${sequence}` };
});
