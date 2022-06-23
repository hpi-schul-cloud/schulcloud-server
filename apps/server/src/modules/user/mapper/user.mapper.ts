import { UserDto } from '@src/modules/user/uc/dto/user.dto';
import { User } from '@shared/domain';
import { SchoolMapper } from '@src/modules/school/mapper/school.mapper';
import { RoleMapper } from '@src/modules/user/mapper/role.mapper';

export class UserMapper {
	static mapFromEntityToDto(entity: User): UserDto {
		return new UserDto({
			email: entity.email,
			firstName: entity.firstName,
			lastName: entity.lastName,
			school: entity.school,
			roles: RoleMapper.mapFromEntitiesToDtos(entity.roles.getItems()),
			ldapDn: entity.ldapDn,
			ldapId: entity.ldapId,
			language: entity.language,
			forcePasswordChange: entity.forcePasswordChange,
			preferences: entity.preferences,
		});
	}

	static mapFromDtoToEntity(dto: UserDto): User {
		return new User({
			email: dto.email,
			firstName: dto.firstName,
			lastName: dto.lastName,
			school: SchoolMapper.mapToEntity(dto.school),
			roles: RoleMapper.mapFromDtosToEntities(dto.roles),
			ldapDn: dto.ldapDn,
			ldapId: dto.ldapId,
			language: dto.language,
			forcePasswordChange: dto.forcePasswordChange,
			preferences: dto.preferences,
		});
	}

	static mapFromEntityToEntity(target: User, source: User): User {
		target.firstName = source.firstName;
		target.lastName = source.lastName;
		target.email = source.email;
		target.school = source.school;
		target.roles = source.roles;
		target.ldapDn = source.ldapDn;
		target.ldapId = source.ldapId;
		target.forcePasswordChange = source.forcePasswordChange;
		target.language = source.language;
		target.preferences = source.preferences;
		return target;
	}
}
