import { DeepMocked } from '@golevelup/ts-jest';
import { instanceFactory } from '@modules/instance/testing';
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
			providers: [InstanceRule, AuthorizationHelper],
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
		describe('when user is a superhero', () => {
			describe('when the user has write permissions', () => {
				const setup = () => {
					const user = userFactory.asSuperhero().build();
					const instance = instanceFactory.build();
					const context: AuthorizationContext = {
						action: Action.write,
						requiredPermissions: [Permission.INSTANCE_VIEW],
					};

					return {
						user,
						instance,
						context,
					};
				};

				it('should check all permissions', () => {
					const { user, instance, context } = setup();
					const spy = jest.spyOn(authorizationHelper, 'hasAllPermissions');

					rule.hasPermission(user, instance, context);

					expect(spy).toHaveBeenCalledWith(user, context.requiredPermissions);
				});

				it('should return true', () => {
					const { user, instance, context } = setup();

					const result = rule.hasPermission(user, instance, context);

					expect(result).toEqual(true);
				});
			});

			describe('when the user has read permissions', () => {
				const setup = () => {
					const user = userFactory.asSuperhero().build();
					const instance = instanceFactory.build();
					const context: AuthorizationContext = {
						action: Action.read,
						requiredPermissions: [Permission.INSTANCE_VIEW],
					};

					return {
						user,
						instance,
						context,
					};
				};

				it('should return true', () => {
					const { user, instance, context } = setup();

					const result = rule.hasPermission(user, instance, context);

					expect(result).toEqual(true);
				});
			});
		});

		describe('when user is a student', () => {
			describe('when the user has no write permission', () => {
				const setup = () => {
					const user = userFactory.asStudent().build();
					const instance = instanceFactory.build();
					const context: AuthorizationContext = {
						action: Action.write,
						requiredPermissions: [Permission.FILESTORAGE_CREATE],
					};

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

			describe('when the user has read permission', () => {
				const setup = () => {
					const user = userFactory.asStudent().build();
					const instance = instanceFactory.build();
					const context: AuthorizationContext = {
						action: Action.read,
						requiredPermissions: [Permission.FILESTORAGE_VIEW],
					};

					return {
						user,
						instance,
						context,
					};
				};

				it('should return true', () => {
					const { user, instance, context } = setup();

					const result = rule.hasPermission(user, instance, context);

					expect(result).toEqual(true);
				});
			});
		});
	});
});
