import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '../entity';
import { RoleRepo } from '../repo';
import { RoleUC } from './role.uc';

describe('RoleUC', () => {
	let service: RoleUC;
	let repo: RoleRepo;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				RoleUC,
				RoleRepo,
				{
					provide: RoleRepo,
					useValue: {
						resolvePermissionsFromSubRolesById() {},
					},
				},
			],
		}).compile();

		service = module.get(RoleUC);
		repo = module.get(RoleRepo);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
		expect(typeof service.resolvePermissionsByIdList).toEqual('function');
	});

	describe('resolvePermissionsByIdList', () => {
		it('should return valid solved and mapped typ', async () => {
			const nameA = `a${Date.now()}`;
			const roleA = new Role({ name: nameA, permissions: ['A', 'C'] });

			const repoSpy = jest.spyOn(repo, 'resolvePermissionsFromSubRolesById').mockImplementation(() => {
				return Promise.resolve(roleA);
			});

			const result = await service.resolvePermissionsByIdList([roleA.id]);
			expect(Object.keys(result).sort()).toEqual(['permissions', 'roles'].sort());

			repoSpy.mockRestore();
		});

		it('should work with emptry id input.', async () => {
			// @ts-expect-error Test Case for Bug BC-315
			const result = await service.resolvePermissionsByIdList();
			expect(result).toEqual({ permissions: [], roles: [] });
		});
	});
});
