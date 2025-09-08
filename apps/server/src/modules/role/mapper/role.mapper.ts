import { Role } from '../repo';
import { RoleDto } from '../service';

export class RoleMapper {
	static mapFromEntityToDto(entity: Role): RoleDto {
		return new RoleDto({
			id: entity.id,
			name: entity.name,
			permissions: entity.permissions,
		});
	}

	static mapFromEntitiesToDtos(enities: Role[]): RoleDto[] {
		return enities.map((entity) => this.mapFromEntityToDto(entity));
	}
}
