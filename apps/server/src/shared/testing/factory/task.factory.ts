import { DeepPartial } from 'fishery';

import { Task, ITaskProperties } from '@shared/domain';
import type { User } from '@shared/domain/entity';

import { BaseFactory } from './base.factory';

class TaskFactory extends BaseFactory<Task, ITaskProperties> {
	draft(): this {
		const params: DeepPartial<ITaskProperties> = { private: true };

		return this.params(params);
	}

	finished(user: User): this {
		const params: DeepPartial<ITaskProperties> = { closed: [user] };
		return this.params(params);
	}
}

export const taskFactory = TaskFactory.define(Task, ({ sequence }) => {
	// private is by default in constructor true, but in the most test cases we need private: false
	return { name: `task #${sequence}`, private: false };
});
