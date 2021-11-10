import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@shared/domain';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { RoleRepo } from '@shared/repo';
import { RoleUC } from './role.uc';

describe('RoleUC', () => {
	let module: TestingModule;
	let service: RoleUC;
	let repo: RoleRepo;

	beforeEach(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
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

	afterEach(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
		expect(typeof service.resolvePermissionsByRoles).toEqual('function');
	});

	describe('resolvePermissionsByRoles', () => {
		it('should return valid solved and mapped typ', async () => {
			const nameA = `a${Date.now()}`;
			const roleA = new Role({ name: nameA, permissions: ['A', 'C'] });

			const repoSpy = jest.spyOn(repo, 'resolvePermissionsFromSubRolesById').mockImplementation(() => {
				return Promise.resolve(roleA);
			});

			const result = await service.resolvePermissionsByRoles([roleA]);
			expect(Object.keys(result).sort()).toEqual(['permissions', 'roles'].sort());

			repoSpy.mockRestore();
		});
	});
});
