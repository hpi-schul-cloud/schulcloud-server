import { DeepPartial } from 'fishery';

import { Task, ITaskProperties } from '@shared/domain';
import type { User } from '@shared/domain/entity';

import { BaseFactory } from './base.factory';

class TaskFactory extends BaseFactory<Task, ITaskProperties> {
	// change the default parameter for testFactory to private: false
	// and remove isDraft from this place and interpret .draft() as true
	// this will cleanup a lot of test code
	draft(isDraft = true): this {
		const params: DeepPartial<ITaskProperties> = { private: isDraft };

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
