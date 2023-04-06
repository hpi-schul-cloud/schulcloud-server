import { Account, School, User } from '@shared/domain';
import { ObjectId } from 'bson';
import { setupEntities } from '../setup-entities';
import { roleFactory } from './role.factory';
import { schoolFactory } from './school.factory';
import { UserAndAccountParams, UserAndAccountTestFactory } from './user-and-account.test.factory';

describe('user-and-account.test.factory', () => {
	beforeAll(async () => {
		await setupEntities();
	});

	const createParams = () => {
		const school = schoolFactory.build();
		const systemId = new ObjectId().toHexString();

		const params: UserAndAccountParams = {
			username: 'UserAndAccount_username',
			email: 'UserAndAccount@email.de',
			firstName: 'UserAndAccount_firstName',
			lastName: 'UserAndAccount_lastname',
			school,
			systemId,
		};

		return params;
	};

	describe('buildUser', () => {
		const setup = () => {
			const roleWithoutId = roleFactory.build();
			const role = roleFactory.buildWithId();

			const params = createParams();

			return { role, roleWithoutId, params };
		};

		it('should create a user without passing additional parameter', () => {
			const { role } = setup();

			const result = UserAndAccountTestFactory.buildUser(role);

			expect(result.user).toBeInstanceOf(User);
			expect(result.account).toBeInstanceOf(Account);
			expect(result.school).toBeInstanceOf(School);
		});

		it('should create a user with id that must be added in account', () => {
			const { role } = setup();

			const result = UserAndAccountTestFactory.buildUser(role);

			expect(result.user.id).toBeDefined();
			expect(result.account.userId).toEqual(result.user.id);
		});

		it('should check if passed role already has a id', () => {
			const { roleWithoutId } = setup();

			expect(() => UserAndAccountTestFactory.buildUser(roleWithoutId)).toThrowError();
		});

		it('should build entities with passed params', () => {
			const { role, params } = setup();

			const result = UserAndAccountTestFactory.buildUser(role, params);

			expect(result.user.firstName).toEqual(params.firstName);
			expect(result.user.lastName).toEqual(params.lastName);
			expect(result.user.email).toEqual(params.email);
			expect(result.user.roles[0]).toEqual(role);

			expect(result.account.systemId).toEqual(params.systemId);
			expect(result.account.username).toEqual(params.username);
		});
	});

	describe('buildStudent', () => {
		const setup = () => {
			const additionalPermissions = []; // check how we can add additional permissions for test without using existing
			const params = createParams();
			const spy = jest.spyOn(UserAndAccountTestFactory, 'buildUser');

			return { additionalPermissions, params, spy };
		};

		it('should call buildUser', () => {
			const { spy } = setup();

			UserAndAccountTestFactory.buildStudent();

			expect(spy).toBeCalled();
		});

		it('should build entities with passed params', () => {
			const { params, additionalPermissions } = setup();

			const result = UserAndAccountTestFactory.buildStudent(params, additionalPermissions);

			expect(result.studentUser).toBeInstanceOf(User);
			expect(result.studentAccount).toBeInstanceOf(Account);
			expect(result.school).toBeInstanceOf(School);

			expect(result.studentUser.firstName).toEqual(params.firstName);
			expect(result.studentUser.lastName).toEqual(params.lastName);
			expect(result.studentUser.email).toEqual(params.email);
			expect(result.studentUser.roles[0]).toBeDefined();

			expect(result.studentAccount.systemId).toEqual(params.systemId);
			expect(result.studentAccount.username).toEqual(params.username);
			// check additional params are passed
		});
	});

	describe('buildTeacher', () => {
		const setup = () => {
			const additionalPermissions = []; // check how we can add additional permissions for test without using existing
			const params = createParams();
			const spy = jest.spyOn(UserAndAccountTestFactory, 'buildUser');

			return { additionalPermissions, params, spy };
		};

		it('should call buildUser', () => {
			const { spy } = setup();

			UserAndAccountTestFactory.buildTeacher();

			expect(spy).toBeCalled();
		});

		it('should build entities with passed params', () => {
			const { params, additionalPermissions } = setup();

			const result = UserAndAccountTestFactory.buildTeacher(params, additionalPermissions);

			expect(result.teacherUser).toBeInstanceOf(User);
			expect(result.teacherAccount).toBeInstanceOf(Account);
			expect(result.school).toBeInstanceOf(School);

			expect(result.teacherUser.firstName).toEqual(params.firstName);
			expect(result.teacherUser.lastName).toEqual(params.lastName);
			expect(result.teacherUser.email).toEqual(params.email);
			expect(result.teacherUser.roles[0]).toBeDefined();

			expect(result.teacherAccount.systemId).toEqual(params.systemId);
			expect(result.teacherAccount.username).toEqual(params.username);
			// check additional params are passed
		});
	});

	describe('buildAdmin', () => {
		const setup = () => {
			const additionalPermissions = []; // check how we can add additional permissions for test without using existing
			const params = createParams();
			const spy = jest.spyOn(UserAndAccountTestFactory, 'buildUser');

			return { additionalPermissions, params, spy };
		};

		it('should call buildUser', () => {
			const { spy } = setup();

			UserAndAccountTestFactory.buildAdmin();

			expect(spy).toBeCalled();
		});

		it('should build entities with passed params', () => {
			const { params, additionalPermissions } = setup();

			const result = UserAndAccountTestFactory.buildAdmin(params, additionalPermissions);

			expect(result.adminUser).toBeInstanceOf(User);
			expect(result.adminAccount).toBeInstanceOf(Account);
			expect(result.school).toBeInstanceOf(School);

			expect(result.adminUser.firstName).toEqual(params.firstName);
			expect(result.adminUser.lastName).toEqual(params.lastName);
			expect(result.adminUser.email).toEqual(params.email);
			expect(result.adminUser.roles[0]).toBeDefined();

			expect(result.adminAccount.systemId).toEqual(params.systemId);
			expect(result.adminAccount.username).toEqual(params.username);
			// check additional params are passed
		});
	});
});
