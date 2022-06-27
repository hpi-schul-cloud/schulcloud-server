import { UserDto } from '@src/modules/user/uc/dto/user.dto';
import { Role, User } from '@shared/domain';
import { SchoolMapper } from '@src/modules/school/mapper/school.mapper';
import { RoleMapper } from '@src/modules/role/mapper/role.mapper';

export class UserMapper {
	static mapFromEntityToDto(entity: User): UserDto {
		return new UserDto({
			id: entity.id,
			email: entity.email,
			firstName: entity.firstName,
			lastName: entity.lastName,
			school: entity.school,
			roles: RoleMapper.mapFromEntitiesToDtos(entity.roles.getItems()),
			ldapDn: entity.ldapDn,
			ldapId: entity.ldapId,
			language: entity.language,
			forcePasswordChange: entity.forcePasswordChange,
			preferences: entity.preferences ?? {},
		});
	}

	static mapFromDtoToEntity(dto: UserDto, rolesEntity: Role[]): User {
		const user = new User({
			email: dto.email,
			firstName: dto.firstName,
			lastName: dto.lastName,
			school: SchoolMapper.mapToEntity(dto.school),
			roles: rolesEntity,
			ldapDn: dto.ldapDn,
			ldapId: dto.ldapId,
			language: dto.language,
			forcePasswordChange: dto.forcePasswordChange,
			preferences: dto.preferences ?? {},
		});
		if (dto.id) {
			user.id = dto.id;
		}
		return user;
	}

	static mapFromEntityToEntity(target: User, source: User): User {
		return Object.assign(target, source);
	}
}
