import { ContextExternalTool } from '@modules/tool/context-external-tool/domain';
import { ContextExternalToolEntity } from '@modules/tool/context-external-tool/entity';
import { contextExternalToolEntityFactory } from '@modules/tool/context-external-tool/testing';
import { SchoolExternalTool } from '@modules/tool/school-external-tool/domain';
import { SchoolExternalToolEntity } from '@modules/tool/school-external-tool/entity';
import { schoolExternalToolEntityFactory } from '@modules/tool/school-external-tool/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { Role, User } from '@shared/domain/entity';
import { Permission } from '@shared/domain/interface';
import { roleFactory, schoolEntityFactory, setupEntities, userFactory } from '@shared/testing';
import { ContextExternalToolRule } from './context-external-tool.rule';
import { Action, AuthorizationHelper } from '@src/modules/authorization';

describe('ContextExternalToolRule', () => {
	let service: ContextExternalToolRule;
	let authorizationHelper: AuthorizationHelper;

	beforeAll(async () => {
		await setupEntities();

		const module: TestingModule = await Test.createTestingModule({
			providers: [AuthorizationHelper, ContextExternalToolRule],
		}).compile();

		service = await module.get(ContextExternalToolRule);
		authorizationHelper = await module.get(AuthorizationHelper);
	});

	beforeEach(() => {});

	const setup = () => {
		const permissionA = 'a' as Permission;
		const permissionB = 'b' as Permission;
		const permissionC = 'c' as Permission;

		const role: Role = roleFactory.build({ permissions: [permissionA, permissionB] });

		const school = schoolEntityFactory.build();
		const schoolExternalToolEntity: SchoolExternalToolEntity | SchoolExternalTool =
			schoolExternalToolEntityFactory.build({
				school,
			});
		const entity: ContextExternalToolEntity | ContextExternalTool = contextExternalToolEntityFactory.build({
			schoolTool: schoolExternalToolEntity,
		});
		const user: User = userFactory.build({ roles: [role], school });
		return {
			permissionA,
			permissionB,
			permissionC,
			school,
			entity,
			user,
			role,
		};
	};

	describe('hasPermission is called', () => {
		describe('when user has permission', () => {
			it('should call hasAllPermissions on AuthorizationHelper', () => {
				const { user, entity } = setup();
				const spy = jest.spyOn(authorizationHelper, 'hasAllPermissions');

				service.hasPermission(user, entity, { action: Action.read, requiredPermissions: [] });

				expect(spy).toBeCalledWith(user, []);
			});

			it('should return "true" if user in scope', () => {
				const { user, entity } = setup();

				const res = service.hasPermission(user, entity, { action: Action.read, requiredPermissions: [] });

				expect(res).toBe(true);
			});
		});

		describe('when user has not permission', () => {
			it('should return "false" if user has not permission', () => {
				const { user, entity, permissionC } = setup();

				const res = service.hasPermission(user, entity, { action: Action.read, requiredPermissions: [permissionC] });

				expect(res).toBe(false);
			});

			it('should return "false" if user has not some school', () => {
				const { permissionA, role } = setup();
				const entity: ContextExternalToolEntity | ContextExternalTool = contextExternalToolEntityFactory.build();
				const user: User = userFactory.build({ roles: [role] });

				const res = service.hasPermission(user, entity, { action: Action.read, requiredPermissions: [permissionA] });

				expect(res).toBe(false);
			});
		});
	});
});
