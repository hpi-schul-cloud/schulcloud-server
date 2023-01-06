import { Injectable } from '@nestjs/common';
import { RoleName } from '@shared/domain';
import { ExternalSchoolDto, ExternalUserDto } from '../../dto';
import { SanisResponse, SanisRole } from './sanis.response';

const RoleMapping = {
	[SanisRole.LEHR]: RoleName.TEACHER,
	[SanisRole.LERN]: RoleName.STUDENT,
	[SanisRole.LEIT]: RoleName.ADMINISTRATOR,
	[SanisRole.ORGADMIN]: RoleName.ADMINISTRATOR,
};

@Injectable()
export class SanisResponseMapper {
	mapToExternalSchoolDto(source: SanisResponse): ExternalSchoolDto {
		return new ExternalSchoolDto({
			name: source.personenkontexte[0].organisation.name,
			externalId: source.personenkontexte[0].organisation.id.toString(),
		});
	}

	mapToExternalUserDto(source: SanisResponse): ExternalUserDto {
		return new ExternalUserDto({
			firstName: source.person.name.vorname,
			lastName: source.person.name.familienname,
			email: source.personenkontexte[0].email,
			roles: [this.mapSanisRoleToRoleName(source)],
			externalId: source.pid,
		});
	}

	private mapSanisRoleToRoleName(source: SanisResponse): RoleName {
		return RoleMapping[source.personenkontexte[0].rolle];
	}
}
