import { Role } from '@shared/domain/entity/role.entity';
import { RoleDto } from '../service/dto/role.dto';

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
