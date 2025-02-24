import { UserDto } from '@modules/user/uc/dto/user.dto';
import { Role } from '@shared/domain/entity';
import { User } from '../repo';

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
