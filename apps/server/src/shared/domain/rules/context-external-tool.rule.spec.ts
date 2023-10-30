import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface/permission.enum';
import { contextExternalToolEntityFactory } from '@shared/testing/factory/context-external-tool-entity.factory';
import { roleFactory } from '@shared/testing/factory/role.factory';
import { schoolExternalToolEntityFactory } from '@shared/testing/factory/school-external-tool-entity.factory';
import { schoolFactory } from '@shared/testing/factory/school.factory';
import { userFactory } from '@shared/testing/factory/user.factory';
import { setupEntities } from '@shared/testing/setup-entities';
import { AuthorizationHelper } from '@src/modules/authorization/authorization.helper';
import { Action } from '@src/modules/authorization/types/action.enum';
import { ContextExternalTool } from '@src/modules/tool/context-external-tool/domain/context-external-tool.do';
import { ContextExternalToolEntity } from '@src/modules/tool/context-external-tool/entity/context-external-tool.entity';
import { SchoolExternalTool } from '@src/modules/tool/school-external-tool/domain/school-external-tool.do';
import { SchoolExternalToolEntity } from '@src/modules/tool/school-external-tool/entity/school-external-tool.entity';
import { Role } from '../entity/role.entity';
import { User } from '../entity/user.entity';
import { ContextExternalToolRule } from './context-external-tool.rule';

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

		const school = schoolFactory.build();
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
