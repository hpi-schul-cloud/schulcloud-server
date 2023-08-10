import { ITaskProperties, Task } from '@shared/domain';
import { User } from '@shared/domain/entity';
import { DeepPartial } from 'fishery';
import { BaseFactory } from './base.factory';
import { schoolFactory } from './school.factory';
import { userFactory } from './user.factory';

const yesterday = new Date(Date.now() - 86400000);

class TaskFactory extends BaseFactory<Task, ITaskProperties> {
	draft(): this {
		const params: DeepPartial<ITaskProperties> = { private: true };

		return this.params(params);
	}

	isPlanned(): this {
		const params: DeepPartial<ITaskProperties> = { private: false, availableDate: new Date(Date.now() + 10000) };

		return this.params(params);
	}

	isPublished(): this {
		const params: DeepPartial<ITaskProperties> = { private: false, availableDate: new Date(Date.now() - 10000) };

		return this.params(params);
	}

	finished(user: User): this {
		const params: DeepPartial<ITaskProperties> = { finished: [user] };
		return this.params(params);
	}
}

export const taskFactory = TaskFactory.define(Task, ({ sequence }) => {
	const school = schoolFactory.build();
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
