import { Injectable } from '@nestjs/common';
import { RoleRepo } from '@shared/repo';
import { EntityId, Role, RoleName } from '@shared/domain';
import { RoleDto } from '@src/modules/role/service/dto/role.dto';
import { RoleMapper } from '@src/modules/role/mapper/role.mapper';

@Injectable()
export class RoleService {
	constructor(private readonly roleRepo: RoleRepo) {}

	async getProtectedRoles(): Promise<RoleDto[]> {
		const roleDtos: RoleDto[] = await this.findByNames([RoleName.ADMINISTRATOR, RoleName.TEACHER]);
		return roleDtos;
	}

	async findById(id: EntityId): Promise<RoleDto> {
		const entity: Role = await this.roleRepo.findById(id);
		const roleDto: RoleDto = RoleMapper.mapFromEntityToDto(entity);
		return roleDto;
	}

	async findByNames(names: RoleName[]): Promise<RoleDto[]> {
		const entities: Role[] = await this.roleRepo.findByNames(names);
		const roleDtos: RoleDto[] = RoleMapper.mapFromEntitiesToDtos(entities);
		return roleDtos;
	}
}
