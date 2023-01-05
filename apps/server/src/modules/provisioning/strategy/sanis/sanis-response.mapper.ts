import { Injectable } from '@nestjs/common';
import { EntityId, RoleName } from '@shared/domain';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { SanisResponse, SanisRole } from './sanis.response';
import { ProvisioningSchoolOutputDto } from '../../dto';

const RoleMapping = {
	[SanisRole.LEHR]: RoleName.TEACHER,
	[SanisRole.LERN]: RoleName.STUDENT,
	[SanisRole.LEIT]: RoleName.ADMINISTRATOR,
	[SanisRole.ORGADMIN]: RoleName.ADMINISTRATOR,
};

@Injectable()
export class SanisResponseMapper {
	mapToSchoolDto(source: SanisResponse, systemId: string): ProvisioningSchoolOutputDto {
		return new ProvisioningSchoolOutputDto({
			name: source.personenkontexte[0].organisation.name,
			externalId: source.personenkontexte[0].organisation.id.toString(),
			systemIds: [systemId],
		});
	}

	mapToUserDO(source: SanisResponse, schoolId: EntityId, roleId: EntityId): UserDO {
		return new UserDO({
			firstName: source.person.name.vorname,
			lastName: source.person.name.familienname,
			email: source.personenkontexte[0].email,
			roleIds: [roleId],
			schoolId,
			externalId: source.pid,
		});
	}

	mapSanisRoleToRoleName(source: SanisResponse): RoleName {
		return RoleMapping[source.personenkontexte[0].rolle];
	}
}
