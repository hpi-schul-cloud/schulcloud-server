import { Test, TestingModule } from '@nestjs/testing';
import { fileElementFactory, roleFactory, setupEntities, userFactory } from '@shared/testing';
import { Permission } from '../interface';
import { Actions } from './actions.enum';
import { FileElementRule } from './file-element.rule';

describe('FileElementRule', () => {
	let service: FileElementRule;
	const permissionA = 'a' as Permission;
	const permissionB = 'b' as Permission;

	beforeAll(async () => {
		await setupEntities();

		const module: TestingModule = await Test.createTestingModule({
			providers: [FileElementRule],
		}).compile();

		service = await module.get(FileElementRule);
	});

	describe('when user has permissions', () => {
		const setup = () => {
			const role = roleFactory.build({ permissions: [permissionA, permissionB] });
			const user = userFactory.build({ roles: [role] });
			const entity = fileElementFactory.build();
			return { user, entity };
		};

		it('should call baseRule.hasAllPermissions', () => {
			const { user, entity } = setup();

			const spy = jest.spyOn(service.utils, 'hasAllPermissions');
			service.hasPermission(user, entity, { action: Actions.read, requiredPermissions: [] });

			expect(spy).toBeCalledWith(user, []);
		});

		it('should return "true"', () => {
			const { user, entity } = setup();

			const res = service.hasPermission(user, entity, { action: Actions.read, requiredPermissions: [] });

			expect(res).toBe(true);
		});

		it.todo('should implement really permission checks');
	});
});
