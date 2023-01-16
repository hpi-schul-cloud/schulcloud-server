import { MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { roleFactory, schoolExternalToolFactory, schoolFactory, setupEntities, userFactory } from '@shared/testing';
import { Role, SchoolExternalTool, User } from '../entity';
import { Permission } from '../interface';
import { Actions } from './actions.enum';
import { SchoolExternalToolRule } from './school-external-tool.rule';
import { SchoolExternalToolDO } from '../domainobject/external-tool/school-external-tool.do';
import { schoolExternalToolDOFactory } from '../../testing/factory/domainobject/school-external-tool.factory';

describe('SchoolExternalToolRule', () => {
	let orm: MikroORM;
	let service: SchoolExternalToolRule;

	beforeAll(async () => {
		orm = await setupEntities();

		const module: TestingModule = await Test.createTestingModule({
			providers: [SchoolExternalToolRule],
		}).compile();

		service = await module.get(SchoolExternalToolRule);
	});

	afterAll(async () => {
		await orm.close();
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
			it('should call baseRule.hasAllPermissions', () => {
				const { user, entity } = setup();
				const spy = jest.spyOn(service.utils, 'hasAllPermissions');

				service.hasPermission(user, entity, { action: Actions.read, requiredPermissions: [] });

				expect(spy).toBeCalledWith(user, []);
			});

			it('should return "true" if user in scope', () => {
				const { user, entity } = setup();

				const res = service.hasPermission(user, entity, { action: Actions.read, requiredPermissions: [] });

				expect(res).toBe(true);
			});
		});

		describe('when user has not permission', () => {
			it('should return "false" if user has not permission', () => {
				const { user, entity, permissionC } = setup();

				const res = service.hasPermission(user, entity, { action: Actions.read, requiredPermissions: [permissionC] });

				expect(res).toBe(false);
			});

			it('should return "false" if user has not some school', () => {
				const { permissionA, role } = setup();
				const entity: SchoolExternalTool | SchoolExternalToolDO = schoolExternalToolDOFactory.build();
				const user: User = userFactory.build({ roles: [role] });

				const res = service.hasPermission(user, entity, { action: Actions.read, requiredPermissions: [permissionA] });

				expect(res).toBe(false);
			});
		});
	});
});
