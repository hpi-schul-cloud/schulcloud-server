import { schoolEntityFactory } from '@modules/school/testing';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { BaseFactory } from '@testing/factory/base.factory';
import { DeepPartial } from 'fishery';
import { Task, TaskProperties } from '../repo';

const yesterday = new Date(Date.now() - 86400000);

class TaskFactory extends BaseFactory<Task, TaskProperties> {
	public draft(): this {
		const params: DeepPartial<TaskProperties> = { private: true };

		return this.params(params);
	}

	public isPlanned(): this {
		const params: DeepPartial<TaskProperties> = { private: false, availableDate: new Date(Date.now() + 10000) };

		return this.params(params);
	}

	public isPublished(): this {
		const params: DeepPartial<TaskProperties> = { private: false, availableDate: new Date(Date.now() - 10000) };

		return this.params(params);
	}

	public finished(user: User): this {
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
