import { Test, TestingModule } from '@nestjs/testing';
import { roleFactory, schoolFactory, setupEntities, userFactory } from '@shared/testing';
import { SchoolDO } from '../domainobject/school.do';
import { Role, School, User } from '../entity';
import { Permission } from '../interface';
import { Actions } from './actions.enum';
import { SchoolRule } from './school.rule';

describe('SchoolRule', () => {
	let service: SchoolRule;
	let user: User;
	let entity: School | SchoolDO;
	let role: Role;
	const permissionA = 'a' as Permission;
	const permissionB = 'b' as Permission;
	const permissionC = 'c' as Permission;

	beforeAll(async () => {
		await setupEntities();

		const module: TestingModule = await Test.createTestingModule({
			providers: [SchoolRule],
		}).compile();

		service = await module.get(SchoolRule);
	});

	beforeEach(() => {
		role = roleFactory.build({ permissions: [permissionA, permissionB] });
		user = userFactory.build({ roles: [role] });
	});

	it('should call baseRule.hasAllPermissions', () => {
		entity = schoolFactory.build();
		user = userFactory.build({ roles: [role], school: entity });
		const spy = jest.spyOn(service.utils, 'hasAllPermissions');
		service.hasPermission(user, entity, { action: Actions.read, requiredPermissions: [] });
		expect(spy).toBeCalledWith(user, []);
	});

	it('should return "true" if user in scope', () => {
		entity = schoolFactory.build();
		user = userFactory.build({ roles: [role], school: entity });
		const res = service.hasPermission(user, entity, { action: Actions.read, requiredPermissions: [] });
		expect(res).toBe(true);
	});

	it('should return "false" if user has not permission', () => {
		entity = schoolFactory.build();
		user = userFactory.build({ roles: [role], school: entity });
		const res = service.hasPermission(user, entity, { action: Actions.read, requiredPermissions: [permissionC] });
		expect(res).toBe(false);
	});

	it('should return "false" if user has not some school', () => {
		entity = new SchoolDO({ name: 'testschool', id: 'invalidId' });
		user = userFactory.build({ roles: [role] });
		const res = service.hasPermission(user, entity, { action: Actions.read, requiredPermissions: [permissionA] });
		expect(res).toBe(false);
	});
});
