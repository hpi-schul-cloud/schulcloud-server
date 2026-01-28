import { createMock, DeepMocked } from '@golevelup/ts-jest';
import {
	Action,
	AUTHORIZATION_CONFIG_TOKEN,
	AuthorizationHelper,
	AuthorizationInjectionService,
} from '@modules/authorization';
import { CourseEntity, CourseGroupEntity } from '@modules/course/repo';
import { LessonEntity, Material } from '@modules/lesson/repo';
import { Role } from '@modules/role/repo';
import { roleFactory } from '@modules/role/testing';
import { schoolEntityFactory } from '@modules/school/testing';
import { Submission, Task } from '@modules/task/repo';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { setupEntities } from '@testing/database';
import { SchoolExternalTool } from '../../school-external-tool/domain';
import { SchoolExternalToolEntity } from '../../school-external-tool/repo';
import { schoolExternalToolEntityFactory } from '../../school-external-tool/testing';
import { ContextExternalTool } from '../domain';
import { ContextExternalToolEntity } from '../repo';
import { contextExternalToolEntityFactory } from '../testing';
import { ContextExternalToolRule } from './context-external-tool.rule';

describe('ContextExternalToolRule', () => {
	let service: ContextExternalToolRule;
	let authorizationHelper: AuthorizationHelper;
	let injectionService: DeepMocked<AuthorizationInjectionService>;

	beforeAll(async () => {
		await setupEntities([User, Task, Submission, CourseEntity, CourseGroupEntity, LessonEntity, Material]);

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AuthorizationHelper,
				ContextExternalToolRule,
				{
					provide: AuthorizationInjectionService,
					useValue: createMock<AuthorizationInjectionService>(),
				},
				{ provide: AUTHORIZATION_CONFIG_TOKEN, useValue: {} },
			],
		}).compile();

		service = await module.get(ContextExternalToolRule);
		authorizationHelper = await module.get(AuthorizationHelper);
		injectionService = await module.get(AuthorizationInjectionService);
	});

	beforeEach(() => {});

	describe('constructor', () => {
		it('should inject itself into the AuthorizationInjectionService', () => {
			expect(injectionService.injectAuthorizationRule).toHaveBeenCalledWith(service);
		});
	});

	describe('hasPermission is called', () => {
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
