import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { RoleName } from '../domain';
import { RoleMapper } from '../mapper/role.mapper';
import { RoleRepo } from '../repo';
import { RoleDto } from './dto';

@Injectable()
export class RoleService {
	constructor(private readonly roleRepo: RoleRepo) {}

	/** @deprecated  We have no application wide protected role expertise. */
	public async getProtectedRoles(): Promise<RoleDto[]> {
		const roleDtos = await this.findByNames([RoleName.ADMINISTRATOR, RoleName.TEACHER]);

		return roleDtos;
	}

	public async findAll(): Promise<RoleDto[]> {
		const entities = await this.roleRepo.findAll();
		const roleDtos = RoleMapper.mapFromEntitiesToDtos(entities);

		return roleDtos;
	}

	public async findById(id: EntityId): Promise<RoleDto> {
		const entity = await this.roleRepo.findById(id);

		const roleDto = RoleMapper.mapFromEntityToDto(entity);

		return roleDto;
	}

	public async findByIds(ids: EntityId[]): Promise<RoleDto[]> {
		const roles = await this.roleRepo.findByIds(ids);

		const roleDtos = RoleMapper.mapFromEntitiesToDtos(roles);

		return roleDtos;
	}

	public async findByNames(names: RoleName[]): Promise<RoleDto[]> {
		const entities = await this.roleRepo.findByNames(names);

		const roleDtos = RoleMapper.mapFromEntitiesToDtos(entities);

		return roleDtos;
	}

	public async findByName(names: RoleName): Promise<RoleDto> {
		const entity = await this.roleRepo.findByName(names);

		const roleDto = RoleMapper.mapFromEntityToDto(entity);

		return roleDto;
	}
}
