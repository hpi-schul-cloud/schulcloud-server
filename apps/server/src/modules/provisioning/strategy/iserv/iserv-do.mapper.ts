import { LegacySchoolDo } from '@shared/domain/domainobject/legacy-school.do';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { RoleName } from '@shared/domain/interface/rolename.enum';
import { ExternalSchoolDto } from '../../dto/external-school.dto';
import { ExternalUserDto } from '../../dto/external-user.dto';

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
