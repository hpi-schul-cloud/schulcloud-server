import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { ProvisioningSchoolOutputDto } from '@src/modules/provisioning/dto/provisioning-school-output.dto';
import { ProvisioningUserOutputDto } from '@src/modules/provisioning/dto/provisioning-user-output.dto';
import { EntityId, RoleName } from '@shared/domain';
import { SanisResponse, SanisRole } from '@src/modules/provisioning/strategy/sanis/sanis.response';

const RoleMapping = {
	[SanisRole.LEHR]: RoleName.TEACHER,
	[SanisRole.LERN]: RoleName.STUDENT,
	[SanisRole.SYSA]: RoleName.ADMINISTRATOR,
};

@Injectable()
export class SanisResponseMapper {
	mapToSchoolDto(source: SanisResponse): ProvisioningSchoolOutputDto {
		return new ProvisioningSchoolOutputDto({
			name: source.personenkontexte[0].organisation.name,
			externalId: source.personenkontexte[0].organisation.orgid.toString(),
		});
	}

	mapToUserDto(source: SanisResponse, schoolId: EntityId): ProvisioningUserOutputDto {
		return new ProvisioningUserOutputDto({
			firstName: source.person.name.vorname,
			lastName: source.person.name.familienname,
			email: '',
			roleNames: [RoleMapping[source.personenkontexte[0].rolle]],
			schoolId,
			externalId: source.pid,
		});
	}
}
