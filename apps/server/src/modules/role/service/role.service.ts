import { Injectable } from '@nestjs/common';
import { RoleRepo } from '@shared/repo';
import { EntityId, RoleName } from '@shared/domain';
import { RoleDto } from '@src/modules/role/service/dto/role.dto';
import { RoleMapper } from '@src/modules/role/mapper/role.mapper';

@Injectable()
export class RoleService {
	constructor(private readonly roleRepo: RoleRepo) {}

	async findById(id: EntityId): Promise<RoleDto> {
		return RoleMapper.mapFromEntityToDto(await this.roleRepo.findById(id));
	}

	async findByName(name: RoleName): Promise<RoleDto> {
		return RoleMapper.mapFromEntityToDto(await this.roleRepo.findByName(name));
	}
}
