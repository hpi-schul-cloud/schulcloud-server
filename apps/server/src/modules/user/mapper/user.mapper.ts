import { User } from '@shared/domain/entity/user.entity';
import { Role } from '../controller/dto/resolved-user.response';
import { UserDto } from '../uc/dto/user.dto';

export class UserMapper {
	static mapFromEntityToDto(entity: User): UserDto {
		return new UserDto({
			id: entity.id,
			email: entity.email,
			firstName: entity.firstName,
			lastName: entity.lastName,
			schoolId: entity.school.id,
			roleIds: entity.roles.getItems().map((role: Role) => role.id),
			ldapDn: entity.ldapDn,
			externalId: entity.externalId,
			language: entity.language,
			forcePasswordChange: entity.forcePasswordChange,
			preferences: entity.preferences,
			lastLoginSystemChange: entity.lastLoginSystemChange,
			outdatedSince: entity.outdatedSince,
		});
	}
}
