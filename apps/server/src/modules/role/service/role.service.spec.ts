import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { NotFoundError } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@shared/domain/entity';
import { RoleName } from '@shared/domain/interface';
import { RoleRepo } from '@shared/repo';
import { roleFactory } from '@shared/testing';
import { RoleDto } from './dto';
import { RoleService } from './role.service';

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

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		testRoleEntity = roleFactory.buildWithId();
	});

	afterEach(() => {
		jest.resetAllMocks();
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

	describe('findByIds is called', () => {
		describe('when searching roles by ids', () => {
			it('should return roles', async () => {
				const role: Role = roleFactory.buildWithId();
				roleRepo.findByIds.mockResolvedValue([role]);

				const result: RoleDto[] = await roleService.findByIds([role.id]);

				expect(result).toEqual<RoleDto[]>([
					{
						id: role.id,
						name: role.name,
						permissions: role.permissions,
					},
				]);
			});
		});
	});

	describe('findByNames', () => {
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

	describe('findByName', () => {
		describe('when a role exists', () => {
			it('should find a role', async () => {
				roleRepo.findByName.mockResolvedValue(testRoleEntity);

				const result: RoleDto = await roleService.findByName(testRoleEntity.name);

				expect(result).toEqual<RoleDto>({
					id: testRoleEntity.id,
					name: testRoleEntity.name,
					permissions: [],
				});
			});
		});

		describe('when no role exists with a name', () => {
			it('should throw an error', async () => {
				roleRepo.findByName.mockRejectedValue(new NotFoundError('not found'));

				await expect(roleService.findByName('unknown role' as unknown as RoleName)).rejects.toThrow(NotFoundError);
			});
		});
	});

	describe('getProtectedRoles', () => {
		it('should call the repo', async () => {
			roleRepo.findByNames.mockResolvedValue([testRoleEntity]);

			await roleService.getProtectedRoles();

			expect(roleRepo.findByNames).toHaveBeenCalledWith([RoleName.ADMINISTRATOR, RoleName.TEACHER]);
		});

		it('should gets a role', async () => {
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
