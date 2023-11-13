import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { RoleName } from '@shared/domain';
import { RoleService, RoleDto } from '../service';
import { RoleUc } from './role.uc';

describe('RoleUc', () => {
	let module: TestingModule;
	let roleUc: RoleUc;
	let roleService: DeepMocked<RoleService>;
	let roleDto: RoleDto;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				RoleUc,
				{
					provide: RoleService,
					useValue: createMock<RoleService>(),
				},
			],
		}).compile();
		roleService = module.get(RoleService);
		roleUc = module.get(RoleUc);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		roleDto = new RoleDto({
			id: '',
			name: RoleName.STUDENT,
			permissions: [],
		});
	});

	describe('findByNames', () => {
		it('should find role dtos', async () => {
			// Arrange
			roleService.findByNames.mockResolvedValue([roleDto]);

			// Act
			const resultRoles: RoleDto[] = await roleUc.findByNames([RoleName.STUDENT]);

			// Assert
			expect(resultRoles).toEqual([roleDto]);
			expect(roleService.findByNames).toHaveBeenCalledWith([RoleName.STUDENT]);
		});
	});
});
