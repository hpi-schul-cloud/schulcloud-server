import { Test, TestingModule } from '@nestjs/testing';
import { SchoolExternalToolDO } from '@shared/domain/domainobject/external-tool/school-external-tool.do';
import { Role, SchoolExternalTool, User } from '@shared/domain/entity';
import { Permission } from '@shared/domain/interface';
import { roleFactory, schoolExternalToolFactory, schoolFactory, setupEntities, userFactory } from '@shared/testing';
import { schoolExternalToolDOFactory } from '@shared/testing/factory/domainobject/school-external-tool.factory';
import { AuthorizationHelper } from '../authorization.helper';
import { Action } from '../types';
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
		const entity: SchoolExternalTool | SchoolExternalToolDO = schoolExternalToolFactory.build();
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

				service.isAuthorized(user, entity, { action: Action.read, requiredPermissions: [] });

				expect(spy).toBeCalledWith(user, []);
			});

			it('should return "true" if user in scope', () => {
				const { user, entity } = setup();

				const res = service.isAuthorized(user, entity, { action: Action.read, requiredPermissions: [] });

				expect(res).toBe(true);
			});
		});

		describe('when user has not permission', () => {
			it('should return "false" if user has not permission', () => {
				const { user, entity, permissionC } = setup();

				const res = service.isAuthorized(user, entity, { action: Action.read, requiredPermissions: [permissionC] });

				expect(res).toBe(false);
			});

			it('should return "false" if user has not some school', () => {
				const { permissionA, role } = setup();
				const entity: SchoolExternalTool | SchoolExternalToolDO = schoolExternalToolDOFactory.build();
				const user: User = userFactory.build({ roles: [role] });

				const res = service.isAuthorized(user, entity, { action: Action.read, requiredPermissions: [permissionA] });

				expect(res).toBe(false);
			});
		});
	});
});
