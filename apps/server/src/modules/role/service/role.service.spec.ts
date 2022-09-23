import { Test, TestingModule } from '@nestjs/testing';
import { RoleService } from '@src/modules/role/service/role.service';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { RoleRepo } from '@shared/repo';
import { Role, RoleName } from '@shared/domain';
import { RoleDto } from '@src/modules/role/service/dto/role.dto';
import { roleFactory } from '@shared/testing';
import { NotFoundError } from '@mikro-orm/core';

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
	});

	describe('findById', () => {
		it('should find role entity', async () => {
			roleRepo.findById.mockResolvedValue(testRoleEntity);
			roleRepo.findByNames.mockResolvedValue([testRoleEntity]);

			const entity: RoleDto = await roleService.findById(testRoleEntity.id);

			expect(entity.id).toEqual(testRoleEntity.id);
			expect(entity.name).toEqual(testRoleEntity.name);
		});

		it('should reject promise, when no entity was found', async () => {
			roleRepo.findById.mockRejectedValue(new NotFoundError('not found'));
			roleRepo.findByNames.mockResolvedValue([testRoleEntity]);

			await expect(roleService.findById('')).rejects.toThrow(NotFoundError);
		});
	});

	describe('findByName', () => {
		it('should find role entity', async () => {
			roleRepo.findByNames.mockResolvedValue([testRoleEntity]);

			const entities: RoleDto[] = await roleService.findByNames([testRoleEntity.name]);

			expect(entities[0].id).toEqual(testRoleEntity.id);
			expect(entities[0].name).toEqual(testRoleEntity.name);
		});

		it('should reject promise, when no entity was found', async () => {
			roleRepo.findByNames.mockRejectedValue(new NotFoundError('not found'));

			await expect(roleService.findByNames(['unknown role' as unknown as RoleName])).rejects.toThrow(NotFoundError);
		});
	});

	describe('getProtectedRoles', () => {
		it('should gets the roles administrator and teacher', async () => {
			roleRepo.findByNames.mockResolvedValue([testRoleEntity]);
			const entities: RoleDto[] = await roleService.getProtectedRoles();

			expect(entities[0]).toBeDefined();
		});

		it('should reject promise, when no entity was found', async () => {
			roleRepo.findByNames.mockRejectedValue(new NotFoundError('not found'));

			await expect(roleService.findByNames([RoleName.HELPDESK])).rejects.toThrow(NotFoundError);
		});
	});
});
