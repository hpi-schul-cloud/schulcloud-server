import { Role as RoleEntity } from '@shared/domain/entity';
import { Role } from '../../domain/role';

export class RoleMapper {
	public static mapToDomain(entity: RoleEntity): Role {
		const roleProps = {
			id: entity.id,
			name: entity.name,
			permissions: entity.permissions,
			roles: entity.roles?.getItems().map((role) => RoleMapper.mapToDomain(role)),
		};

		const role = new Role(roleProps);

		return role;
	}
}
