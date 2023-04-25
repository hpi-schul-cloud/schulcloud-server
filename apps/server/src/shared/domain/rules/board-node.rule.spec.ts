import { Test, TestingModule } from '@nestjs/testing';
import { fileElementFactory, roleFactory, setupEntities, userFactory } from '@shared/testing';
import { Permission } from '../interface';
import { Actions } from './actions.enum';
import { BoardNodeRule } from './board-node.rule';

describe(BoardNodeRule.name, () => {
	let service: BoardNodeRule;
	const permissionA = 'a' as Permission;
	const permissionB = 'b' as Permission;

	beforeAll(async () => {
		await setupEntities();

		const module: TestingModule = await Test.createTestingModule({
			providers: [BoardNodeRule],
		}).compile();

		service = await module.get(BoardNodeRule);
	});

	describe('isApplicable', () => {
		const setup = () => {
			const role = roleFactory.build({ permissions: [permissionA, permissionB] });
			const user = userFactory.build({ roles: [role] });
			const entity = fileElementFactory.build();
			return { user, entity };
		};

		describe('when entity is applicable', () => {
			it('should return true', () => {
				const { user, entity } = setup();

				const result = service.isApplicable(user, entity);

				expect(result).toStrictEqual(true);
			});
		});

		describe('when entity  is not applicable', () => {
			it('should return false', () => {
				const { user } = setup();
				// @ts-expect-error test wrong entity
				const result = service.isApplicable(user, user);

				expect(result).toStrictEqual(false);
			});
		});
	});

	describe('hasPermission', () => {
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
