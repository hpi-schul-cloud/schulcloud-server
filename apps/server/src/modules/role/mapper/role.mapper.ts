import { Role } from '@shared/domain';
import { RoleDto } from '@src/modules/user/uc/dto/role.dto';

export class RoleMapper {
	static mapFromEntityToDto(entity: Role): RoleDto {
		return new RoleDto({
			id: entity.id,
			name: entity.name,
			permissions: entity.permissions,
		});
	}

	static mapFromEntitiesToDtos(enities: Role[]): RoleDto[] {
		return enities.map((entity) => {
			return this.mapFromEntityToDto(entity);
		});
	}
}
