import { Role } from '@shared/domain';
import { RoleDto } from '@src/modules/user/uc/dto/role.dto';

export class RoleMapper {
	static mapFromEntityToDto(entity: Role): RoleDto {
		return new RoleDto({
			permissions: entity.permissions,
			roles: RoleMapper.mapFromEntitiesToDtos(entity.roles.getItems()), //TODO
			name: entity.name,
		});
	}

	static mapFromDtoToEntity(dto: RoleDto): Role {
		return new Role({
			permissions: dto.permissions,
			roles: RoleMapper.mapFromDtosToEntities(dto.roles),
			name: dto.name,
		});
	}

	static mapFromEntitiesToDtos(enities: Role[]): RoleDto[] {
		return enities.map((entity) => {
			return this.mapFromEntityToDto(entity);
		});
	}

	static mapFromDtosToEntities(dtos: RoleDto[]): Role[] {
		return dtos.map((dto) => {
			return this.mapFromDtoToEntity(dto);
		});
	}
}
