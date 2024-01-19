import { schoolFactory } from '@modules/school/testing/school.factory';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { roleFactory, setupEntities, userFactory } from '@shared/testing';
import { AuthorizationContextBuilder } from '../mapper';
import { AuthorizationHelper } from '../service/authorization.helper';
import { SchoolRule } from './school.rule';

describe('SchoolRule', () => {
	let rule: SchoolRule;

	beforeAll(async () => {
		await setupEntities();

		const module: TestingModule = await Test.createTestingModule({
			providers: [AuthorizationHelper, SchoolRule],
		}).compile();

		rule = await module.get(SchoolRule);
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
			const setup = () => {
				const { user, school } = setupSchoolAndUser();

				return { user, school };
			};

			it('should return true', () => {
				const { user, school } = setup();

				const result = rule.isApplicable(user, school);

				expect(result).toBe(true);
			});
		});

		describe('when object is not instance of School', () => {
			const setup = () => {
				const { user } = setupSchoolAndUser();
				const someRandomObject = { foo: 'bar' };

				return { user, someRandomObject };
			};

			it('should return false', () => {
				const { user, someRandomObject } = setup();

				// @ts-expect-error Testcase
				const result = rule.isApplicable(user, someRandomObject);

				expect(result).toBe(false);
			});
		});
	});

	describe('hasPermission', () => {
		describe('when user has required permissions and it is her school', () => {
			const setup = () => {
				const { user, school } = setupSchoolAndUser();
				const context = AuthorizationContextBuilder.read([permissionA]);

				return { user, school, context };
			};

			it('should return true', () => {
				const { user, school, context } = setup();

				const result = rule.hasPermission(user, school, context);

				expect(result).toBe(true);
			});
		});

		describe('when user does not have required permissions', () => {
			const setup = () => {
				const { user, school } = setupSchoolAndUser();
				const context = AuthorizationContextBuilder.read([permissionB]);

				return { user, school, context };
			};

			it('should return false', () => {
				const { user, school, context } = setup();

				const result = rule.hasPermission(user, school, context);

				expect(result).toBe(false);
			});
		});

		describe('when it is not the users school', () => {
			const setup = () => {
				const { user } = setupSchoolAndUser();
				const someOtherSchool = schoolFactory.build();
				const context = AuthorizationContextBuilder.read([]);

				return { user, someOtherSchool, context };
			};

			it('should return false', () => {
				const { user, someOtherSchool, context } = setup();

				const result = rule.hasPermission(user, someOtherSchool, context);

				expect(result).toBe(false);
			});
		});
	});
});
