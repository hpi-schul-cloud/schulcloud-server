import { Injectable } from '@nestjs/common';
import { Role } from '@shared/domain/entity';
import { RoleName } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { RoleRepo } from '@shared/repo';
import { RoleMapper } from '../mapper/role.mapper';
import { RoleDto } from './dto';

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

	async findByIds(ids: EntityId[]): Promise<RoleDto[]> {
		const roles: Role[] = await this.roleRepo.findByIds(ids);

		const roleDtos: RoleDto[] = RoleMapper.mapFromEntitiesToDtos(roles);

		return roleDtos;
	}

	async findByNames(names: RoleName[]): Promise<RoleDto[]> {
		const entities: Role[] = await this.roleRepo.findByNames(names);

		const roleDtos: RoleDto[] = RoleMapper.mapFromEntitiesToDtos(entities);

		return roleDtos;
	}

	async findByName(names: RoleName): Promise<RoleDto> {
		const entity: Role = await this.roleRepo.findByName(names);

		const roleDto: RoleDto = RoleMapper.mapFromEntityToDto(entity);

		return roleDto;
	}
}
