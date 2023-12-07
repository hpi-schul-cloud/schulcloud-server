import { schoolFactory } from '@modules/school/testing/school.factory';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { roleFactory, setupEntities, userFactory } from '@shared/testing';
import { AuthorizationContextBuilder } from '../mapper';
import { AuthorizationHelper } from '../service/authorization.helper';
import { SchoolRule } from './school.rule';

describe('SchoolRule', () => {
	let service: SchoolRule;

	beforeAll(async () => {
		await setupEntities();

		const module: TestingModule = await Test.createTestingModule({
			providers: [AuthorizationHelper, SchoolRule],
		}).compile();

		service = await module.get(SchoolRule);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	const permissionA = 'a' as Permission;
	const permissionB = 'b' as Permission;

	const setupSchoolAndUser = () => {
		const school = schoolFactory.build();
		const role = roleFactory.build({ permissions: [permissionA] });
		const user = userFactory.build({
			roles: [role],
			school,
		});

		return { school, user };
	};

	describe('isApplicable', () => {
		describe('when object is instance of School', () => {
			it('should return true', () => {
				const { user, school } = setupSchoolAndUser();

				const result = service.isApplicable(user, school);

				expect(result).toBe(true);
			});
		});

		describe('when object is not instance of School', () => {
			it('should return false', () => {
				const { user } = setupSchoolAndUser();
				const someRandomObject = { foo: 'bar' };

				// @ts-expect-error Testcase
				const result = service.isApplicable(user, someRandomObject);

				expect(result).toBe(false);
			});
		});
	});

	describe('hasPermission', () => {
		describe('when user has required permissions and it is her school', () => {
			it('should return true', () => {
				const { user, school } = setupSchoolAndUser();
				const context = AuthorizationContextBuilder.read([permissionA]);

				const result = service.hasPermission(user, school, context);

				expect(result).toBe(true);
			});
		});

		describe('when user does not have required permissions', () => {
			it('should return false', () => {
				const { user, school } = setupSchoolAndUser();
				const context = AuthorizationContextBuilder.read([permissionB]);

				const result = service.hasPermission(user, school, context);

				expect(result).toBe(false);
			});
		});

		describe('when it is not the users school', () => {
			it('should return false', () => {
				const { user } = setupSchoolAndUser();
				const someOtherSchool = schoolFactory.build();
				const context = AuthorizationContextBuilder.read([]);

				const result = service.hasPermission(user, someOtherSchool, context);

				expect(result).toBe(false);
			});
		});
	});
});
