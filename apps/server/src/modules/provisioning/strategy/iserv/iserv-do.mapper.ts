import { LegacySchoolDo, UserDO } from '@shared/domain/domainobject';
import { RoleName } from '@shared/domain/interface';
import { ExternalSchoolDto, ExternalUserDto } from '../../dto';

export class IservMapper {
	static mapToExternalSchoolDto(schoolDO: LegacySchoolDo): ExternalSchoolDto {
		return new ExternalSchoolDto({
			name: schoolDO.name,
			externalId: schoolDO.externalId || '',
			officialSchoolNumber: schoolDO.officialSchoolNumber,
		});
	}

	static mapToExternalUserDto(userDO: UserDO, roleNames: RoleName[]): ExternalUserDto {
		return new ExternalUserDto({
			firstName: userDO.firstName,
			lastName: userDO.lastName,
			email: userDO.email,
			roles: roleNames,
			externalId: userDO.externalId || '',
		});
	}
}
