import { ObjectId } from '@mikro-orm/mongodb';
import { AccountEntity } from '@modules/account/domain/entity/account.entity';
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { schoolEntityFactory } from '@modules/school/testing';
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { User } from '@modules/user/repo';
import { setupEntities } from '@testing/database';
import { UserAndAccountParams, UserAndAccountTestFactory } from './user-and-account.test.factory';

describe('user-and-account.test.factory', () => {
	beforeAll(async () => {
		await setupEntities([User]);
	});

	const createParams = () => {
		const school = schoolEntityFactory.build();
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

	describe('buildStudent', () => {
		const setup = () => {
			const additionalPermissions = []; // check how we can add additional permissions for test without using existing
			const params = createParams();

			return { additionalPermissions, params };
		};

		it('should build entities with passed params', () => {
			const { params, additionalPermissions } = setup();

			const result = UserAndAccountTestFactory.buildStudent(params, additionalPermissions);

			expect(result.studentUser).toBeInstanceOf(User);
			expect(result.studentAccount).toBeInstanceOf(AccountEntity);

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

			return { additionalPermissions, params };
		};

		it('should build entities with passed params', () => {
			const { params, additionalPermissions } = setup();

			const result = UserAndAccountTestFactory.buildTeacher(params, additionalPermissions);

			expect(result.teacherUser).toBeInstanceOf(User);
			expect(result.teacherAccount).toBeInstanceOf(AccountEntity);

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

			return { additionalPermissions, params };
		};

		it('should build entities with passed params', () => {
			const { params, additionalPermissions } = setup();

			const result = UserAndAccountTestFactory.buildAdmin(params, additionalPermissions);

			expect(result.adminUser).toBeInstanceOf(User);
			expect(result.adminAccount).toBeInstanceOf(AccountEntity);

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
