import { Test, TestingModule } from '@nestjs/testing';
import {
	contextExternalToolFactory,
	roleFactory,
	schoolExternalToolFactory,
	schoolFactory,
	setupEntities,
	userFactory,
} from '@shared/testing';

import { AuthorizationHelper } from '@src/modules/authorization/authorization.helper';
import { Action } from '@src/modules/authorization/types';
import { ContextExternalToolDO } from '@src/modules/tool/context-external-tool/domain';
import { ContextExternalTool } from '@src/modules/tool/context-external-tool/entity';
import { SchoolExternalToolDO } from '@src/modules/tool/school-external-tool/domain';
import { SchoolExternalToolEntity } from '@src/modules/tool/school-external-tool/entity';
import { Role, User } from '../entity';
import { Permission } from '../interface';
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
		const schoolExternalToolEntity: SchoolExternalToolEntity | SchoolExternalToolDO = schoolExternalToolFactory.build({
			school,
		});
		const entity: ContextExternalTool | ContextExternalToolDO = contextExternalToolFactory.build({
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
				const entity: ContextExternalTool | ContextExternalToolDO = contextExternalToolFactory.build();
				const user: User = userFactory.build({ roles: [role] });

				const res = service.hasPermission(user, entity, { action: Action.read, requiredPermissions: [permissionA] });

				expect(res).toBe(false);
			});
		});
	});
});
