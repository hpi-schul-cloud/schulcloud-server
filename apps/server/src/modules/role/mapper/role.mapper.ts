import { type Role } from '../repo';
import { RoleDto } from '../service/dto';

export class RoleMapper {
	public static mapFromEntityToDto(entity: Role): RoleDto {
		return new RoleDto({
			id: entity.id,
			name: entity.name,
			permissions: entity.permissions,
		});
	}

	public static mapFromEntitiesToDtos(enities: Role[]): RoleDto[] {
		return enities.map((entity) => this.mapFromEntityToDto(entity));
	}
}
