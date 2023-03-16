import { UserDto } from '@src/modules/user/uc/dto/user.dto';
import { Role, School, User } from '@shared/domain';

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

	static mapFromDtoToEntity(dto: UserDto, rolesEntity: Role[], school: School): User {
		const user = new User({
			email: dto.email,
			firstName: dto.firstName,
			lastName: dto.lastName,
			school,
			roles: rolesEntity,
			ldapDn: dto.ldapDn,
			externalId: dto.externalId,
			language: dto.language,
			forcePasswordChange: dto.forcePasswordChange,
			preferences: dto.preferences,
			lastLoginSystemChange: dto.lastLoginSystemChange,
			outdatedSince: dto.outdatedSince,
		});
		if (dto.id) {
			user.id = dto.id;
		}
		return user;
	}

	static mapFromEntityToEntity(target: User, source: User): User {
		target.firstName = source.firstName;
		target.lastName = source.lastName;
		target.email = source.email;
		target.school = source.school;
		target.roles = source.roles;
		target.ldapDn = source.ldapDn ?? target.ldapDn;
		target.externalId = source.externalId ?? target.externalId;
		target.forcePasswordChange = source.forcePasswordChange ?? target.forcePasswordChange;
		target.language = source.language ?? target.language;
		target.lastLoginSystemChange = source.lastLoginSystemChange ?? target.lastLoginSystemChange;
		target.outdatedSince = source.outdatedSince ?? target.outdatedSince;
		// Cannot patch preferences with empty object, because preferences is optional, but is always set in the constructor of the entity,
		// so we can't check if the field is undefined. it is always initialized with an empty object.
		target.preferences =
			source.preferences && Object.keys(source.preferences).length !== 0 ? source.preferences : target.preferences;

		return target;
	}
}
