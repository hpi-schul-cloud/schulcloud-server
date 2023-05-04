import { Test, TestingModule } from '@nestjs/testing';
import { fileElementFactory, roleFactory, setupEntities, userFactory } from '@shared/testing';
import { Action } from '@src/modules';
import { AuthorizationHelper } from '@src/modules/authorization/authorization.helper';
import { Permission } from '../interface';
import { BoardNodeRule } from './board-node.rule';

describe(BoardNodeRule.name, () => {
	let service: BoardNodeRule;
	let authorizationHelper: AuthorizationHelper;

	beforeAll(async () => {
		await setupEntities();

		const module: TestingModule = await Test.createTestingModule({
			providers: [BoardNodeRule, AuthorizationHelper],
		}).compile();

		service = await module.get(BoardNodeRule);
		authorizationHelper = await module.get(AuthorizationHelper);
	});

	describe('isApplicable', () => {
		describe('when entity is applicable', () => {
			const setup = () => {
				const user = userFactory.build();
				const entity = fileElementFactory.build();
				return { user, entity };
			};

			it('should return true', () => {
				const { user, entity } = setup();

				const result = service.isApplicable(user, entity);

				expect(result).toStrictEqual(true);
			});
		});

		describe('when entity is not applicable', () => {
			const setup = () => {
				const user = userFactory.build();
				return { user };
			};

			it('should return false', () => {
				const { user } = setup();
				// @ts-expect-error test wrong entity
				const result = service.isApplicable(user, user);

				expect(result).toStrictEqual(false);
			});
		});
	});

	describe('hasPermission', () => {
		describe('when user has permission', () => {
			const setup = () => {
				const permissionA = 'a' as Permission;
				const permissionB = 'b' as Permission;
				const role = roleFactory.build({ permissions: [permissionA, permissionB] });
				const user = userFactory.build({ roles: [role] });
				const entity = fileElementFactory.build();
				return { user, entity };
			};

			it('should call baseRule.hasAllPermissions', () => {
				const { user, entity } = setup();

				const spy = jest.spyOn(authorizationHelper, 'hasAllPermissions');
				service.hasPermission(user, entity, { action: Action.read, requiredPermissions: [] });

				expect(spy).toBeCalledWith(user, []);
			});

			it('should return "true"', () => {
				const { user, entity } = setup();

				const res = service.hasPermission(user, entity, { action: Action.read, requiredPermissions: [] });

				expect(res).toBe(true);
			});
		});

		it.todo('should implement really permission checks');
	});
});
