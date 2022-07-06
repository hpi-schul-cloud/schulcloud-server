import { Test, TestingModule } from '@nestjs/testing';
import { RoleService } from '@src/modules/role/service/role.service';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { RoleRepo } from '@shared/repo';
import { roleFactory } from '@shared/testing';
import { EntityId, Role, RoleName } from '@shared/domain';
import { RoleDto } from '@src/modules/role/service/dto/role.dto';

describe('RoleService', () => {
	let module: TestingModule;
	let roleService: RoleService;

	let roleRepo: DeepMocked<RoleRepo>;
	let testRoleEntity: Role;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				RoleService,
				{
					provide: RoleRepo,
					useValue: createMock<RoleRepo>(),
				},
			],
		}).compile();
		roleService = module.get(RoleService);
		roleRepo = module.get(RoleRepo);
	});

	beforeEach(() => {
		testRoleEntity = roleFactory.buildWithId();
		roleRepo.findById.mockImplementation(async (id: EntityId): Promise<Role> => {
			return id === testRoleEntity.id ? Promise.resolve(testRoleEntity) : Promise.reject();
		});
		roleRepo.findByNames.mockImplementation(async (names: RoleName[]): Promise<Role[]> => {
			return names.some(() => names.includes(testRoleEntity.name)).valueOf()
				? Promise.resolve([testRoleEntity])
				: Promise.reject();
		});
	});

	describe('findById', () => {
		it('should find role entity', async () => {
			const entity: RoleDto = await roleService.findById(testRoleEntity.id);

			expect(entity.id).toEqual(testRoleEntity.id);
			expect(entity.name).toEqual(testRoleEntity.name);
		});
		it('should reject promise, when no entity was found', async () => {
			await expect(roleService.findById('')).rejects.toEqual(undefined);
		});
	});

	describe('findByName', () => {
		it('should find role entity', async () => {
			const entity: RoleDto[] = await roleService.findByNames([testRoleEntity.name]);

			expect(entity[0].id).toEqual(testRoleEntity.id);
			expect(entity[0].name).toEqual(testRoleEntity.name);
		});
		it('should reject promise, when no entity was found', async () => {
			await expect(roleService.findByNames(['unknown role' as unknown as RoleName])).rejects.toEqual(undefined);
		});
	});
});
