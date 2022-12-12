import { Injectable } from '@nestjs/common';
import { ProvisioningSchoolOutputDto } from '@src/modules/provisioning/dto/provisioning-school-output.dto';
import { EntityId, RoleName } from '@shared/domain';
import { SanisResponse, SanisRole } from '@src/modules/provisioning/strategy/sanis/sanis.response';
import { UserDO } from '@shared/domain/domainobject/user.do';

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
			email: '',
			roleIds: [roleId],
			schoolId,
			externalId: source.pid,
		});
	}

	mapSanisRoleToRoleName(source: SanisResponse): RoleName {
		return RoleMapping[source.personenkontexte[0].rolle];
	}
}
