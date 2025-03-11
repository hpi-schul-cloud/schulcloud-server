import { LegacySchoolDo } from '@modules/legacy-school/domain';
import { UserDo } from '@modules/user';
import { ExternalSchoolDto, ExternalUserDto } from '../../dto';
import { RoleName } from '@modules/role';

export class IservMapper {
	static mapToExternalSchoolDto(schoolDO: LegacySchoolDo): ExternalSchoolDto {
		return new ExternalSchoolDto({
			name: schoolDO.name,
			externalId: schoolDO.externalId || '',
			officialSchoolNumber: schoolDO.officialSchoolNumber,
		});
	}

	static mapToExternalUserDto(userDO: UserDo, roleNames: RoleName[]): ExternalUserDto {
		return new ExternalUserDto({
			firstName: userDO.firstName,
			lastName: userDO.lastName,
			email: userDO.email,
			roles: roleNames,
			externalId: userDO.externalId || '',
		});
	}
}
