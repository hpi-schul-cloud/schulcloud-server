import { BaseFactory } from './base.factory';

describe('BaseFactory', () => {
	interface IUserProperties {
		email: string;
		roles: string[];
	}

	class User implements IUserProperties {
		email: string;

		roles: string[];

		constructor(props: IUserProperties) {
			this.email = props.email;
			this.roles = props.roles;
		}
	}

	it('should override properties', () => {
		const userFactory = BaseFactory.define<User, IUserProperties>(User, () => {
			return { email: 'joe@example.com', roles: ['member'] };
		});
		const user = userFactory.build({ roles: ['admin'] });
		expect(user).toBeInstanceOf(User);
		expect(user.roles).toEqual(['admin']);
	});
});
