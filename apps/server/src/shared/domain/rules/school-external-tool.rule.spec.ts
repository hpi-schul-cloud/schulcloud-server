import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface/permission.enum';
import { schoolExternalToolFactory } from '@shared/testing/factory/domainobject/tool/school-external-tool.factory';
import { roleFactory } from '@shared/testing/factory/role.factory';
import { schoolExternalToolEntityFactory } from '@shared/testing/factory/school-external-tool-entity.factory';
import { schoolFactory } from '@shared/testing/factory/school.factory';
import { userFactory } from '@shared/testing/factory/user.factory';
import { setupEntities } from '@shared/testing/setup-entities';
import { AuthorizationHelper } from '@src/modules/authorization/authorization.helper';
import { Action } from '@src/modules/authorization/types/action.enum';
import { SchoolExternalTool } from '@src/modules/tool/school-external-tool/domain/school-external-tool.do';
import { SchoolExternalToolEntity } from '@src/modules/tool/school-external-tool/entity/school-external-tool.entity';
import { Role } from '../entity/role.entity';
import { User } from '../entity/user.entity';
import { SchoolExternalToolRule } from './school-external-tool.rule';

describe('SchoolExternalToolRule', () => {
	let service: SchoolExternalToolRule;
	let authorizationHelper: AuthorizationHelper;

	beforeAll(async () => {
		await setupEntities();

		const module: TestingModule = await Test.createTestingModule({
			providers: [AuthorizationHelper, SchoolExternalToolRule],
		}).compile();

		service = await module.get(SchoolExternalToolRule);
		authorizationHelper = await module.get(AuthorizationHelper);
	});

	beforeEach(() => {});

	const setup = () => {
		const permissionA = 'a' as Permission;
		const permissionB = 'b' as Permission;
		const permissionC = 'c' as Permission;

		const role: Role = roleFactory.build({ permissions: [permissionA, permissionB] });

		const school = schoolFactory.build();
		const entity: SchoolExternalToolEntity | SchoolExternalTool = schoolExternalToolEntityFactory.build();
		entity.school = school;
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
				const entity: SchoolExternalToolEntity | SchoolExternalTool = schoolExternalToolFactory.build();
				const user: User = userFactory.build({ roles: [role] });

				const res = service.hasPermission(user, entity, { action: Action.read, requiredPermissions: [permissionA] });

				expect(res).toBe(false);
			});
		});
	});
});
