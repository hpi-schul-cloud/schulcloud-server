import { User as UserEntity } from '@shared/domain/entity';
import { User } from '../../domain/user';
import { RoleMapper } from './role.mapper';

export class UserMapper {
	public static mapToDomain(entity: UserEntity): User {
		const userProps = {
			id: entity.id,
			firstName: entity.firstName,
			roles: entity.roles.getItems().map((role) => RoleMapper.mapToDomain(role)),
			schoolName: entity.school.name,
		};

		const user = new User(userProps);

		return user;
	}
}
