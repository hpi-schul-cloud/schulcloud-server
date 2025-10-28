import { SchoolEntity } from '@modules/school/repo';
import { RoomSetup, UserSetupCompact } from './room-setup.helper';
import { EntityManager } from '@mikro-orm/core';
import { Role } from '@modules/role/repo';
import { User } from '@modules/user/repo';
import { Account } from '@modules/account';
import { TestApiClient } from '@testing/test-api-client';
import { GroupUserEmbeddable } from '@modules/group/entity';

// /Users/HoeppneM/sources/schulcloud-server/apps/server/src/modules/room/api/test/util/room-setup.helper.spec.ts

// ----- Mocks for factories & roles -----
let idCounter = 1;
const nextId = () => `id-${idCounter++}`;

jest.mock('@modules/role/testing', () => {
	return {
		roleFactory: {
			buildWithId: (data: object) => {
				return { id: nextId(), ...data };
			},
		},
	};
});

jest.mock('../../../testing/room-roles.test.factory', () => {
	return {
		RoomRolesTestFactory: {
			createRoomRoles: () => {
				return {
					roomOwnerRole: { id: nextId(), name: 'roomowner' },
					roomAdminRole: { id: nextId(), name: 'roomadmin' },
					roomEditorRole: { id: nextId(), name: 'roomeditor' },
					roomViewerRole: { id: nextId(), name: 'roomviewer' },
				};
			},
		},
	};
});
jest.mock('@modules/school/testing', () => {
	return {
		schoolEntityFactory: {
			buildWithId: () => {
				return { id: nextId(), name: `School-${idCounter}` };
			},
		},
	};
});
jest.mock('@modules/user/testing', () => {
	return {
		userFactory: {
			buildWithId: ({ school, firstName, roles }: { school: SchoolEntity; firstName: string; roles: Role[] }) => {
				return {
					id: nextId(),
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
				return { id: nextId(), schoolId };
			},
		},
	};
});
jest.mock('@modules/room-membership/testing/room-membership-entity.factory', () => {
	return {
		roomMembershipEntityFactory: {
			build: ({ userGroupId, roomId, schoolId }: { userGroupId: string; roomId: string; schoolId: string }) => {
				return {
					id: nextId(),
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
							id: nextId(),
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
				return { id: nextId(), user, userId: user.id };
			},
		},
	};
});

// ----- TestApiClient stub -----
class TestApiClientStub {
	login = jest.fn((account: Account) => {
		return { client: this, account };
	});
}

// ----- Fake EntityManager -----
const createEm = () =>
	({
		persistAndFlush: jest.fn(async () => {}),
		clear: jest.fn(),
	} as unknown as EntityManager);

// ----- Tests -----
describe('RoomSetup', () => {
	let em: EntityManager;
	let apiClient: TestApiClientStub;
	let roomSetup: RoomSetup;

	beforeEach(() => {
		idCounter = 1;
		em = createEm();
		apiClient = new TestApiClientStub();
		roomSetup = new RoomSetup(em, apiClient as unknown as TestApiClient);
	});

	it('sets up users, room, membership, and user group based on compact setup', async () => {
		const setups: UserSetupCompact[] = [
			['Alice', 'sameSchool', 'administrator', 'roomowner'],
			['Bob', 'sameSchool', 'teacher', 'roomadmin'],
			['Carol', 'sameSchool', 'student', 'none'],
			['Dave', 'otherSchool', 'student', 'roomviewer'],
		];
		await roomSetup.setup(setups);

		expect(roomSetup.users.map((u) => u.firstName).sort()).toEqual(['Alice', 'Bob', 'Carol', 'Dave'].sort());
		expect(roomSetup.room).toBeDefined();
		expect(roomSetup.roomMembership).toBeDefined();
		expect(roomSetup.userGroupEntity).toBeDefined();
		expect(roomSetup.roomMembership.userGroupId).toBe(roomSetup.userGroupEntity.id);

		// Only users with room role appear in group entity
		const groupUserNames = roomSetup.userGroupEntity.users.map((u: GroupUserEmbeddable) => u.user.firstName).sort();
		expect(groupUserNames).toEqual(['Alice', 'Bob', 'Dave'].sort());

		// Roles on group users correspond to requested room roles
		const roleNames = roomSetup.userGroupEntity.users.map((u: GroupUserEmbeddable) => u.role.name).sort();
		expect(roleNames).toEqual(['roomadmin', 'roomowner', 'roomviewer'].sort());
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

	it('createAccountForUser persists account and returns it', async () => {
		await roomSetup.setup([['Alice', 'sameSchool', 'administrator', 'roomowner']]);
		const account = await roomSetup.createAccountForUser('Alice');
		expect(account).toBeDefined();
		// persistAndFlush called
		expect((em as any).persistAndFlush).toHaveBeenCalled();
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
