import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { instanceFactory } from '@modules/instances/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { setupEntities, userFactory } from '@shared/testing';
import { AuthorizationHelper } from '../service/authorization.helper';
import { Action, AuthorizationContext } from '../type';
import { InstanceRule } from './instance.rule';

describe(InstanceRule.name, () => {
	let module: TestingModule;
	let rule: InstanceRule;

	let authorizationHelper: DeepMocked<AuthorizationHelper>;

	beforeAll(async () => {
		await setupEntities();

		module = await Test.createTestingModule({
			providers: [
				InstanceRule,
				{
					provide: AuthorizationHelper,
					useValue: createMock<AuthorizationHelper>(),
				},
			],
		}).compile();

		rule = module.get(InstanceRule);
		authorizationHelper = module.get(AuthorizationHelper);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('isApplicable', () => {
		describe('when the entity is applicable', () => {
			const setup = () => {
				const user = userFactory.build();
				const instance = instanceFactory.build();

				return {
					user,
					instance,
				};
			};

			it('should return true', () => {
				const { user, instance } = setup();

				const result = rule.isApplicable(user, instance);

				expect(result).toEqual(true);
			});
		});

		describe('when the entity is not applicable', () => {
			const setup = () => {
				const user = userFactory.build();
				const notInstance = userFactory.build();

				return {
					user,
					notInstance,
				};
			};

			it('should return false', () => {
				const { user, notInstance } = setup();

				const result = rule.isApplicable(user, notInstance as unknown as InstanceRule);

				expect(result).toEqual(false);
			});
		});
	});

	describe('hasPermission', () => {
		describe('when the user has all permissions', () => {
			const setup = () => {
				const user = userFactory.build();
				const instance = instanceFactory.build();
				const context: AuthorizationContext = {
					action: Action.write,
					requiredPermissions: [Permission.FILESTORAGE_VIEW],
				};

				authorizationHelper.hasAllPermissions.mockReturnValue(true);

				return {
					user,
					instance,
					context,
				};
			};

			it('should check all permissions', () => {
				const { user, instance, context } = setup();

				rule.hasPermission(user, instance, context);

				expect(authorizationHelper.hasAllPermissions).toHaveBeenCalledWith(user, context.requiredPermissions);
			});

			it('should return true', () => {
				const { user, instance, context } = setup();

				const result = rule.hasPermission(user, instance, context);

				expect(result).toEqual(true);
			});
		});

		describe('when the user has no permission', () => {
			const setup = () => {
				const user = userFactory.build();
				const instance = instanceFactory.build();
				const context: AuthorizationContext = {
					action: Action.write,
					requiredPermissions: [Permission.FILESTORAGE_VIEW],
				};

				authorizationHelper.hasAllPermissions.mockReturnValue(false);

				return {
					user,
					instance,
					context,
				};
			};

			it('should return false', () => {
				const { user, instance, context } = setup();

				const result = rule.hasPermission(user, instance, context);

				expect(result).toEqual(false);
			});
		});
	});
});
