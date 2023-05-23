import { Test, TestingModule } from '@nestjs/testing';
import { roleFactory, setupEntities, userFactory } from '@shared/testing';
import { Action } from '@src/modules';
import { AuthorizationHelper } from '@src/modules/authorization/authorization.helper';
import { ObjectId } from 'bson';
import { BoardDoAuthorizable, BoardRoles } from '../domainobject';
import { Permission } from '../interface';
import { BoardDoRule } from './board-do.rule';

describe(BoardDoRule.name, () => {
	let service: BoardDoRule;
	let authorizationHelper: AuthorizationHelper;

	beforeAll(async () => {
		await setupEntities();

		const module: TestingModule = await Test.createTestingModule({
			providers: [BoardDoRule, AuthorizationHelper],
		}).compile();

		service = await module.get(BoardDoRule);
		authorizationHelper = await module.get(AuthorizationHelper);
	});

	describe('isApplicable', () => {
		describe('when entity is applicable', () => {
			const setup = () => {
				const user = userFactory.build();
				const boardDoAuthorizable = new BoardDoAuthorizable({ users: [], id: new ObjectId().toHexString() });
				return { user, boardDoAuthorizable };
			};

			it('should return true', () => {
				const { user, boardDoAuthorizable } = setup();

				const result = service.isApplicable(user, boardDoAuthorizable);

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
				const user = userFactory.buildWithId({ roles: [role] });
				const boardDoAuthorizable = new BoardDoAuthorizable({
					users: [{ userId: user.id, roles: [BoardRoles.EDITOR] }],
					id: new ObjectId().toHexString(),
				});

				return { user, boardDoAuthorizable };
			};

			it('should call hasAllPermissions on AuthorizationHelper', () => {
				const { user, boardDoAuthorizable } = setup();

				const spy = jest.spyOn(authorizationHelper, 'hasAllPermissions');
				service.hasPermission(user, boardDoAuthorizable, { action: Action.read, requiredPermissions: [] });

				expect(spy).toBeCalledWith(user, []);
			});

			it('should return "true"', () => {
				const { user, boardDoAuthorizable } = setup();

				const res = service.hasPermission(user, boardDoAuthorizable, { action: Action.read, requiredPermissions: [] });

				expect(res).toBe(true);
			});
		});

		describe('when user does not have permission', () => {
			const setup = () => {
				const permissionA = 'a' as Permission;
				const permissionB = 'b' as Permission;
				const role = roleFactory.build({ permissions: [permissionA, permissionB] });
				const user = userFactory.buildWithId({ roles: [role] });
				const userWithoutPermision = userFactory.buildWithId({ roles: [role] });
				const boardDoAuthorizable = new BoardDoAuthorizable({
					users: [{ userId: user.id, roles: [BoardRoles.EDITOR] }],
					id: new ObjectId().toHexString(),
				});

				return { userWithoutPermision, boardDoAuthorizable };
			};

			it('should return "true"', () => {
				const { userWithoutPermision, boardDoAuthorizable } = setup();

				const res = service.hasPermission(userWithoutPermision, boardDoAuthorizable, {
					action: Action.read,
					requiredPermissions: [],
				});

				expect(res).toBe(false);
			});
		});
	});
});
