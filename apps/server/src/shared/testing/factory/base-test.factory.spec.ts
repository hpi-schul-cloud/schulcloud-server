import { BaseTestFactory } from './base-test.factory';

describe('BaseTestFactory', () => {
	interface IUserProperties {
		email: string;
		roles: string[];
		nickName?: string;
	}

	class User {
		email: string;

		roles: string[];

		nickName?: string;

		constructor(props: IUserProperties) {
			this.email = props.email;
			this.roles = props.roles;
			this.nickName = props.nickName;
		}
	}

	interface UserTransientParams {
		registered: boolean;
		numTasks: number;
	}

	describe('when defining the factory', () => {
		it('should call the constructor', () => {
			const Constructor = jest.fn();
			const factory = BaseTestFactory.define<typeof Constructor, IUserProperties>(Constructor, () => {
				return {
					email: 'joe@example.com',
					roles: ['member'],
				};
			});
			factory.build();
			expect(Constructor).toBeCalledTimes(1);
			expect(Constructor).toBeCalledWith({ email: 'joe@example.com', roles: ['member'] });
		});

		it('should create an instance of the class', () => {
			const factory = BaseTestFactory.define<User, IUserProperties>(User, () => {
				return {
					email: 'joe@example.com',
					roles: ['member'],
				};
			});
			const user = factory.build();
			expect(user).toBeInstanceOf(User);
		});

		it('should override default properties', () => {
			const factory = BaseTestFactory.define<User, IUserProperties>(User, () => {
				return {
					email: 'joe@example.com',
					roles: ['member'],
				};
			});
			const user = factory.build({ roles: ['admin'] });
			expect(user.roles).toEqual(['admin']);
		});

		it('should call afterBuild hook', () => {
			const factory = BaseTestFactory.define<User, IUserProperties>(User, () => {
				return {
					email: 'joe@example.com',
					roles: ['member'],
				};
			});
			const afterBuild = jest.fn((user: User) => {
				user.email = 'foo@example.com';
				return user;
			});
			const user = factory.afterBuild(afterBuild).build();
			expect(user.email).toEqual('foo@example.com');
			expect(afterBuild).toHaveBeenCalledWith(user);
		});

		it('should delegate transient params as a trait', () => {
			const factory = BaseTestFactory.define<User, IUserProperties, UserTransientParams>(
				User,
				({ transientParams }) => {
					const { registered, numTasks } = transientParams;
					return { email: `joe-${registered ? 'r' : 'u'}-${numTasks || '0'}@example.com`, roles: ['member'] };
				}
			);
			const user = factory.transient({ registered: true, numTasks: 10 }).build();
			expect(user.email).toEqual('joe-r-10@example.com');
		});

		it('should delegate transientParams as a build option', () => {
			const factory = BaseTestFactory.define<User, IUserProperties, UserTransientParams>(
				User,
				({ transientParams }) => {
					const { registered, numTasks } = transientParams;
					return { email: `joe-${registered ? 'r' : 'u'}-${numTasks || '0'}@example.com`, roles: ['member'] };
				}
			);
			const user = factory.build({}, { transient: { registered: true, numTasks: 10 } });
			expect(user.email).toEqual('joe-r-10@example.com');
		});

		it('should delegate associations as a trait', () => {
			const factory = BaseTestFactory.define<User, IUserProperties>(User, ({ associations }) => {
				return {
					email: 'joe@example.com',
					roles: associations.roles || ['member'],
				};
			});
			const user = factory.associations({ roles: ['admin'] }).build();
			expect(user.roles).toEqual(['admin']);
		});

		it('should delegate associations as build option', () => {
			const factory = BaseTestFactory.define<User, IUserProperties, UserTransientParams>(User, ({ associations }) => {
				return {
					email: 'joe@example.com',
					roles: associations.roles || ['member'],
				};
			});
			const user = factory.build({}, { associations: { roles: ['admin'] } });
			expect(user.roles).toEqual(['admin']);
		});
	});

	describe('when subclassing the factory', () => {
		class UserFactory extends BaseTestFactory<User, IUserProperties, UserTransientParams> {
			admin() {
				return this.params({ roles: ['admin'] });
			}

			withNickName(nickName: string) {
				return this.params({ nickName });
			}

			withCountedNickName(nickName: string) {
				const s = this.sequence();
				return this.params({ nickName: `${nickName}-${s}` });
			}
		}

		it('should override properties', () => {
			const factory = UserFactory.define(User, () => {
				return { email: 'joe@example.com', roles: ['member'] };
			});
			const user = factory.admin().withNickName('stewie').build();
			expect(user.email).toEqual('joe@example.com');
			expect(user.roles).toEqual(['admin']);
			expect(user.nickName).toEqual('stewie');
		});

		it('should provide the sequence', () => {
			const factory = UserFactory.define(User, () => {
				return { email: 'joe@example.com', roles: ['member'] };
			});
			const user = factory.withCountedNickName('nick').build();
			expect(user.nickName).toEqual('nick-1');
		});

		it('should make the sequence rewindable', () => {
			const factory = UserFactory.define(User, () => {
				return { email: 'joe@example.com', roles: ['member'] };
			});
			const user1 = factory.withCountedNickName('nick').build();
			factory.rewindSequence();
			const user2 = factory.withCountedNickName('nick').build();
			expect(user1.nickName).toEqual('nick-1');
			expect(user2.nickName).toEqual('nick-1');
		});
	});

	describe('when builing a list of objects', () => {
		it('should call the constructor for each item', () => {
			const Constructor = jest.fn();
			const factory = BaseTestFactory.define<typeof Constructor, IUserProperties>(Constructor, ({ sequence }) => {
				return {
					email: `joe-${sequence}@example.com`,
					roles: ['member'],
				};
			});
			factory.buildList(3);
			expect(Constructor).toBeCalledTimes(3);
		});

		it('should create an instance of the class for each item', () => {
			const factory = BaseTestFactory.define<User, IUserProperties>(User, ({ sequence }) => {
				return {
					email: `joe-${sequence}@example.com`,
					roles: ['member'],
				};
			});
			const users = factory.buildList(2);
			expect(users[0]).toBeInstanceOf(User);
			expect(users[0].email).toEqual('joe-1@example.com');
			expect(users[1].email).toEqual('joe-2@example.com');
		});

		it('should override properties', () => {
			const factory = BaseTestFactory.define<User, IUserProperties>(User, ({ sequence }) => {
				return {
					email: `joe-${sequence}@example.com`,
					roles: ['member'],
				};
			});
			const users = factory.buildList(2, { nickName: `stewie` });
			expect(users[0].nickName).toEqual('stewie');
			expect(users[1].nickName).toEqual('stewie');
		});
	});
});
