import { Task, User } from '@shared/domain/entity';
import { TaskProperties } from '@shared/domain/types';
import { DeepPartial } from 'fishery';
import { BaseFactory } from './base.factory';
import { schoolEntityFactory } from './school-entity.factory';
import { userFactory } from './user.factory';

const yesterday = new Date(Date.now() - 86400000);

class TaskFactory extends BaseFactory<Task, TaskProperties> {
	draft(): this {
		const params: DeepPartial<TaskProperties> = { private: true };

		return this.params(params);
	}

	isPlanned(): this {
		const params: DeepPartial<TaskProperties> = { private: false, availableDate: new Date(Date.now() + 10000) };

		return this.params(params);
	}

	isPublished(): this {
		const params: DeepPartial<TaskProperties> = { private: false, availableDate: new Date(Date.now() - 10000) };

		return this.params(params);
	}

	finished(user: User): this {
		const params: DeepPartial<TaskProperties> = { finished: [user] };
		return this.params(params);
	}
}

export const taskFactory = TaskFactory.define(Task, ({ sequence }) => {
	const school = schoolEntityFactory.build();
	const creator = userFactory.build({ school });
	// private is by default in constructor true, but in the most test cases we need private: false
	return {
		name: `task #${sequence}`,
		private: false,
		availableDate: yesterday,
		creator,
		school,
	};
});
