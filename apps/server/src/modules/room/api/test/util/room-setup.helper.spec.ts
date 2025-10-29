import { SchoolEntity } from '@modules/school/repo';
import { RoomSetup, UserSetupCompact } from './room-setup.helper';
import { EntityManager } from '@mikro-orm/core';
import { Role } from '@modules/role/repo';
import { User } from '@modules/user/repo';
import { Account } from '@modules/account';
import { TestApiClient } from '@testing/test-api-client';
import { ObjectId } from 'bson';

jest.mock('@modules/role/testing', () => {
	return {
		roleFactory: {
			buildWithId: (data: object) => {
				return { id: new ObjectId().toHexString(), ...data };
			},
		},
	};
});

let schoolIdCounter = 0;
jest.mock('@modules/school/testing', () => {
	return {
		schoolEntityFactory: {
			buildWithId: () => {
				return { id: new ObjectId().toHexString(), name: `School-${schoolIdCounter++}` };
			},
		},
	};
});
jest.mock('@modules/user/testing', () => {
	return {
		userFactory: {
			buildWithId: ({ school, firstName, roles }: { school: SchoolEntity; firstName: string; roles: Role[] }) => {
				return {
					id: new ObjectId().toHexString(),
					firstName,
					roles,
					school,
					schoolId: school.id,
				};
			},
		},
	};
});
jest.mock('../../../testing/room-entity.factory', () => {
	return {
		roomEntityFactory: {
			buildWithId: ({ schoolId }: { schoolId: string }) => {
				return { id: new ObjectId().toHexString(), schoolId };
			},
		},
	};
});
jest.mock('@modules/room-membership/testing/room-membership-entity.factory', () => {
	return {
		roomMembershipEntityFactory: {
			build: ({ userGroupId, roomId, schoolId }: { userGroupId: string; roomId: string; schoolId: string }) => {
				return {
					id: new ObjectId().toHexString(),
					userGroupId,
					roomId,
					schoolId,
				};
			},
		},
	};
});
jest.mock('@modules/group/testing', () => {
	return {
		groupEntityFactory: {
			withTypeRoom: () => {
				return {
					buildWithId: ({ users, organization }: { users: any[]; organization: SchoolEntity }) => {
						return {
							id: new ObjectId().toHexString(),
							users,
							organization,
							type: 'room',
						};
					},
				};
			},
		},
	};
});
jest.mock('@testing/factory/user-and-account.test.factory', () => {
	return {
		UserAndAccountTestFactory: {
			buildAccount: (user: User) => {
				return { id: new ObjectId().toHexString(), user, userId: user.id };
			},
		},
	};
});

class TestApiClientStub {
	login = jest.fn((account: Account) => {
		return { client: this, account };
	});
}

const createEm = () =>
	({
		persistAndFlush: jest.fn(async () => {}),
		clear: jest.fn(),
	} as unknown as EntityManager);

describe('RoomSetup', () => {
	let em: EntityManager;
	let apiClient: TestApiClientStub;
	let roomSetup: RoomSetup;

	beforeEach(() => {
		em = createEm();
		apiClient = new TestApiClientStub();
		roomSetup = new RoomSetup(em, apiClient as unknown as TestApiClient);
	});

	describe('when setting up a room', () => {
		const setup = async () => {
			const userSetup: UserSetupCompact[] = [
				['Alice', 'sameSchool', 'administrator', 'roomowner'],
				['Bob', 'sameSchool', 'teacher', 'none'],
				['Carol', 'sameSchool', 'student', 'none'],
				['Dave', 'otherSchool', 'student', 'roomviewer'],
			];
			await roomSetup.setup(userSetup);
			return roomSetup;
		};

		it('should add users as members that have a room role', async () => {
			const roomSetup = await setup();

			expect(roomSetup.users.map((u) => u.firstName).sort()).toEqual(['Alice', 'Bob', 'Carol', 'Dave'].sort());
		});

		it('should create a room', async () => {
			const roomSetup = await setup();

			expect(roomSetup.room).toBeDefined();
		});

		it('should create a room membership', async () => {
			const roomSetup = await setup();

			expect(roomSetup.roomMembership).toBeDefined();
		});

		it('should create a user group entity', async () => {
			const roomSetup = await setup();

			expect(roomSetup.userGroupEntity).toBeDefined();
		});

		it('should link room membership to user group entity', async () => {
			const roomSetup = await setup();

			expect(roomSetup.roomMembership.userGroupId).toBe(roomSetup.userGroupEntity.id);
		});

		it('getUserByName returns correct user', async () => {
			await roomSetup.setup([['Alice', 'sameSchool', 'administrator', 'roomowner']]);
			const user = roomSetup.getUserByName('Alice');
			expect(user.firstName).toBe('Alice');
		});

		it('getUserByName throws for missing user', async () => {
			await roomSetup.setup([['Alice', 'sameSchool', 'administrator', 'roomowner']]);
			expect(() => roomSetup.getUserByName('Bob')).toThrow(/not found/);
		});

		it('getRoleByName returns correct role', async () => {
			await roomSetup.setup([['Alice', 'sameSchool', 'administrator', 'roomowner']]);
			const role = roomSetup.getRoleByName('roomowner');
			expect(role.name).toBe('roomowner');
		});

		it('getRoleByName throws for missing role', async () => {
			await roomSetup.setup([['Alice', 'sameSchool', 'administrator', 'roomowner']]);
			expect(() => roomSetup.getRoleByName('speaker')).toThrow(/not found/);
		});

		it('createAccountForUser persists account and returns it', async () => {
			await roomSetup.setup([['Alice', 'sameSchool', 'administrator', 'roomowner']]);
			const account = await roomSetup.createAccountForUser('Alice');
			expect(account).toBeDefined();
			expect((em as unknown as EntityManager).persistAndFlush).toHaveBeenCalled();
		});

		it('createAccountForUser throws when user is unknown', async () => {
			await roomSetup.setup([['Alice', 'sameSchool', 'administrator', 'roomowner']]);
			await expect(roomSetup.createAccountForUser('Bob')).rejects.toThrow(/not found/);
		});

		it('loginUser creates account and invokes api client login', async () => {
			await roomSetup.setup([['Alice', 'sameSchool', 'administrator', 'roomowner']]);
			const client = await roomSetup.loginUser('Alice');
			expect(apiClient.login).toHaveBeenCalledTimes(1);
			expect(client).toBeDefined();
		});

		it('room getter throws before setup', () => {
			expect(() => roomSetup.room).toThrow(/Room not set up/);
		});

		it('roomMembership getter throws before setup', () => {
			expect(() => roomSetup.roomMembership).toThrow(/Room membership not set up/);
		});

		it('userGroupEntity getter throws before setup', () => {
			expect(() => roomSetup.userGroupEntity).toThrow(/User group entity not set up/);
		});
	});

	describe('when setup was not called yet', () => {
		describe('when accessing the room getter', () => {
			it('should throw an error', () => {
				expect(() => roomSetup.room).toThrow(/Room not set up/);
			});
		});

		describe('when accessing the roomMembership getter', () => {
			it('should throw an error', () => {
				expect(() => roomSetup.roomMembership).toThrow(/Room membership not set up/);
			});
		});

		describe('when accessing the userGroupEntity getter', () => {
			it('should throw an error', () => {
				expect(() => roomSetup.userGroupEntity).toThrow(/User group entity not set up/);
			});
		});

		describe('when accessing sameSchool getter', () => {
			it('should throw an error', () => {
				expect(() => roomSetup.sameSchool).toThrow(/Same school not set up/);
			});
		});

		describe('when accessing otherSchool getter', () => {
			it('should throw an error', () => {
				expect(() => roomSetup.otherSchool).toThrow(/Other school not set up/);
			});
		});

		describe('when accessing entity manager getter', () => {
			it('should return the entity manager', () => {
				expect(roomSetup.em).toBe(em);
			});
		});
	});
});
