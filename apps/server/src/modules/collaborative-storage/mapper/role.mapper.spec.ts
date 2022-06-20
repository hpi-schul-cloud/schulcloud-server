import { Test, TestingModule } from '@nestjs/testing';
import { RoleMapper } from '@src/modules/collaborative-storage/mapper/role.mapper';
import { roleFactory } from '@shared/testing';
import { Role } from '@shared/domain';
import { RoleDto } from '@src/modules/collaborative-storage/services/dto/role.dto';

describe('RoleMapper', () => {
	let module: TestingModule;
	let mapper: RoleMapper;

	beforeEach(async () => {
		module = await Test.createTestingModule({
			imports: [],
			providers: [RoleMapper],
		}).compile();
		mapper = module.get(RoleMapper);
	});

	describe('Map Role', () => {
		it('should map entity to dto', () => {
			const roleEntity: Role = roleFactory.build();
			const ret: RoleDto = mapper.mapEntityToDto(roleEntity);
			expect(ret.name).toEqual(roleEntity.name);
		});
	});
});
