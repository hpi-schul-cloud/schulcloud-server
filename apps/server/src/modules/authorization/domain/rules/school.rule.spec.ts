import { Permission } from '@shared/domain/interface/permission.enum';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { schoolFactory } from '@modules/school/testing/school.factory';
import { Test, TestingModule } from '@nestjs/testing';
import { schoolEntityFactory, setupEntities, userFactory } from '@shared/testing';
import { AuthorizationContextBuilder } from '../mapper';
import { AuthorizationHelper } from '../service/authorization.helper';
import { SchoolRule } from './school.rule';

describe('SchoolRule', () => {
	let rule: SchoolRule;
	let authorizationHelper: DeepMocked<AuthorizationHelper>;
	let module: TestingModule;

	beforeAll(async () => {
		await setupEntities();

		module = await Test.createTestingModule({
			providers: [SchoolRule, { provide: AuthorizationHelper, useValue: createMock<AuthorizationHelper>() }],
		}).compile();

		rule = await module.get(SchoolRule);
		authorizationHelper = await module.get(AuthorizationHelper);
	});

	const setupSchoolAndUser = () => {
		const school = schoolFactory.build();
		const user = userFactory.build({ school: schoolEntityFactory.buildWithId(undefined, school.id) });
		const superUser = userFactory.asSuperhero([Permission.SCHOOL_EDIT_ALL]).build();

		return { school, user, superUser };
	};

	afterEach(() => {
		jest.clearAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

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

				const result = rule.isApplicable(user, someRandomObject);

				expect(result).toBe(false);
			});
		});
	});

	describe('hasPermission', () => {
		describe('when user has required permissions and it is her school', () => {
			const setup = () => {
				const { user, school } = setupSchoolAndUser();
				const context = AuthorizationContextBuilder.read([]);

				authorizationHelper.hasAllPermissions.mockReturnValueOnce(true);

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
				const context = AuthorizationContextBuilder.read([]);

				authorizationHelper.hasAllPermissions.mockReturnValue(false);

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

				authorizationHelper.hasAllPermissions.mockReturnValueOnce(false);

				return { user, someOtherSchool, context };
			};

			it('should return false', () => {
				const { user, someOtherSchool, context } = setup();

				const result = rule.hasPermission(user, someOtherSchool, context);

				expect(result).toBe(false);
			});
		});

		describe('when the user has super powers', () => {
			const setup = () => {
				const { superUser } = setupSchoolAndUser();
				const someOtherSchool = schoolFactory.build();
				const context = AuthorizationContextBuilder.read([]);

				authorizationHelper.hasAllPermissions.mockReturnValueOnce(true);

				return { superUser, someOtherSchool, context };
			};

			it('should return true', () => {
				const { superUser, someOtherSchool, context } = setup();

				const result = rule.hasPermission(superUser, someOtherSchool, context);

				expect(result).toBe(true);
			});
		});
	});
});
