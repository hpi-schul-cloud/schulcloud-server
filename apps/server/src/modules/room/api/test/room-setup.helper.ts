import { groupEntityFactory } from '@modules/group/testing';
import { Role } from '@modules/role/repo';
import { roleFactory } from '@modules/role/testing';
import { roomMembershipEntityFactory } from '@modules/room-membership/testing/room-membership-entity.factory';
import { RoomEntity } from '@modules/room/repo';
import { SchoolEntity } from '@modules/school/repo';
import { schoolEntityFactory } from '@modules/school/testing';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { roomEntityFactory } from '../../testing/room-entity.factory';
import { RoomRolesTestFactory } from '../../testing/room-roles.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import { RoleName } from '@modules/role';
import { EntityManager } from '@mikro-orm/core';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { AccountEntity } from '@modules/account/repo';
import { RoomMember } from '@modules/room-membership/do/room-member.do';
import { RoomMembershipEntity } from '@modules/room-membership';
import { GroupEntity } from '@modules/group/entity';

export type UserSetupCompact = [
	string,
	'sameSchool' | 'otherSchool',
	'administrator' | 'teacher' | 'student',
	'roomowner' | 'roomadmin' | 'roomeditor' | 'roomviewer' | 'none'
];

export type UserSetup = {
	name: string;
	school: 'sameSchool' | 'otherSchool';
	schoolRoleName: 'administrator' | 'teacher' | 'student';
	roomRoleName: 'roomowner' | 'roomadmin' | 'roomeditor' | 'roomviewer' | 'none';
};

export type UserSetupWithRoles = UserSetup & {
	schoolRole: Role;
	roomRole?: Role;
};

export class RoomSetup {
	private roles: Record<string, Role> = {};
	private _users: User[] = [];
	private _room: RoomEntity | undefined;
	private _roomMembership: RoomMembershipEntity | undefined;
	private _userGroupEntity: GroupEntity | undefined;
	private _sameSchool: SchoolEntity | undefined;
	private _otherSchool: SchoolEntity | undefined;

	constructor(private readonly _em: EntityManager, private readonly testApiClient: TestApiClient) {}

	public setup = async (userSetupsCompact: UserSetupCompact[]): Promise<void> => {
		const userSetups: UserSetup[] = userSetupsCompact.map(([name, school, schoolRoleName, roomRoleName]) => {
			return {
				name,
				school,
				schoolRoleName,
				roomRoleName,
			};
		});
		await this.setupComplexRoom(userSetups);
	};

	public createAccountForUser = async (loggedinUserName: string): Promise<AccountEntity> => {
		const loggedInUser = this._users.find((u) => u.firstName === loggedinUserName);
		if (!loggedInUser) {
			throw new Error(`Logged in user ${loggedinUserName} not found in users`);
		}
		const loggedInAccount = UserAndAccountTestFactory.buildAccount(loggedInUser);
		await this.em.persistAndFlush(loggedInAccount);
		this.em.clear();
		return loggedInAccount;
	};

	public loginUser = async (userName: string): Promise<TestApiClient> => {
		const loggedInAccount = await this.createAccountForUser(userName);
		const loggedInClient = await this.testApiClient.login(loggedInAccount);
		return loggedInClient;
	};

	get room(): RoomEntity {
		if (!this._room) {
			throw new Error('Room not set up yet');
		}
		return this._room;
	}

	get roomMembership(): RoomMembershipEntity {
		if (!this._roomMembership) {
			throw new Error('Room membership not set up yet');
		}
		return this._roomMembership;
	}

	get userGroupEntity(): GroupEntity {
		if (!this._userGroupEntity) {
			throw new Error('User group entity not set up yet');
		}
		return this._userGroupEntity;
	}

	get users(): User[] {
		return this._users;
	}

	get sameSchool(): SchoolEntity {
		if (!this._sameSchool) {
			throw new Error('Same school not set up yet');
		}
		return this._sameSchool;
	}

	get otherSchool(): SchoolEntity {
		if (!this._otherSchool) {
			throw new Error('Other school not set up yet');
		}
		return this._otherSchool;
	}

	get em(): EntityManager {
		if (!this._em) {
			throw new Error('EntityManager not set up yet');
		}
		return this._em;
	}

	public getUserByName(name: string): User {
		const user = this._users.find((u) => u.firstName === name);
		if (!user) {
			throw new Error(`User with name ${name} not found`);
		}
		return user;
	}

	private setupComplexRoom = async (userSetups: UserSetup[]): Promise<void> => {
		await this.setupRoles();
		this._sameSchool = schoolEntityFactory.buildWithId();
		this._otherSchool = schoolEntityFactory.buildWithId();

		const userSetupsWithRoles = this.appendRoles(userSetups);
		const sameSchoolUserSetups = userSetupsWithRoles.filter((setup) => setup.school === 'sameSchool');
		const otherSchoolUserSetups = userSetupsWithRoles.filter((setup) => setup.school === 'otherSchool');

		const sameSchoolUsers = await this.setupSingleRoleUsers(this._sameSchool, sameSchoolUserSetups);
		const otherSchoolUsers = await this.setupSingleRoleUsers(this._otherSchool, otherSchoolUserSetups);
		const users = [...sameSchoolUsers, ...otherSchoolUsers];
		this._users = users;

		await this.setupRoom(this._sameSchool, users, userSetupsWithRoles);
		this.em.clear();
	};

	private setupRoles = async (): Promise<void> => {
		const administrator = roleFactory.buildWithId({ name: RoleName.ADMINISTRATOR });
		const teacher = roleFactory.buildWithId({ name: RoleName.TEACHER });
		const student = roleFactory.buildWithId({ name: RoleName.STUDENT });
		const { roomEditorRole, roomAdminRole, roomOwnerRole, roomViewerRole } = RoomRolesTestFactory.createRoomRoles();

		await this.em.persistAndFlush([
			administrator,
			teacher,
			student,
			roomEditorRole,
			roomAdminRole,
			roomOwnerRole,
			roomViewerRole,
		]);
		this.em.clear();

		this.roles = {
			administrator,
			teacher,
			student,
			roomeditor: roomEditorRole,
			roomadmin: roomAdminRole,
			roomowner: roomOwnerRole,
			roomviewer: roomViewerRole,
		};
	};

	private setupRoom = async (
		school: SchoolEntity,
		userEntities: User[],
		userSetups: UserSetupWithRoles[]
	): Promise<void> => {
		const room = roomEntityFactory.buildWithId({ schoolId: school.id });

		const users: { role: Role; user: User }[] = userEntities.reduce((acc: { role: Role; user: User }[], userEntity) => {
			const userSetup = userSetups.find((setup) => setup.name === userEntity.firstName);
			if (!userSetup) {
				throw new Error(`No user setup found for user ${userEntity.firstName}`);
			}
			if (userSetup.roomRole && userEntity) {
				acc.push({ role: userSetup.roomRole, user: userEntity });
			}
			return acc;
		}, []);

		const userGroupEntity = groupEntityFactory.withTypeRoom().buildWithId({
			users,
			organization: school,
			externalSource: undefined,
		});

		const roomMembership = roomMembershipEntityFactory.build({
			userGroupId: userGroupEntity.id,
			roomId: room.id,
			schoolId: school.id,
		});

		await this.em.persistAndFlush([room, roomMembership, userGroupEntity]);
		this.em.clear();

		this._room = room;
		this._roomMembership = roomMembership;
		this._userGroupEntity = userGroupEntity;
	};

	private setupSingleRoleUsers = async (school: SchoolEntity, userSetups: UserSetupWithRoles[]): Promise<User[]> => {
		const users = userSetups.map((setup) =>
			userFactory.buildWithId({
				school,
				firstName: setup.name,
				roles: [setup.schoolRole],
			})
		);
		users.forEach((u) => {
			console.log({ name: u.firstName, roles: u.roles });
		});
		await this.em.persistAndFlush(users);
		this.em.clear();
		return users;
	};

	private setupUser = async (school: SchoolEntity, firstName: string, roles: Role[]): Promise<User> => {
		const user = userFactory.buildWithId({
			school,
			firstName,
			roles,
		});
		await this.em.persistAndFlush(user);
		this.em.clear();
		return user;
	};

	private appendRoles = (setups: UserSetup[]): UserSetupWithRoles[] =>
		setups.map((setup) => {
			const schoolRole = this.roles[setup.schoolRoleName];
			const roomRole = setup.roomRoleName !== 'none' ? this.roles[setup.roomRoleName] : undefined;
			return { ...setup, schoolRole, roomRole };
		});
}
