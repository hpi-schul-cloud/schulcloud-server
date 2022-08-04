import { IProviderResponseMapper } from '@src/modules/provisioning/interface/provider-response.mapper.interface';
import { Injectable } from '@nestjs/common';
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
export class SanisResponseMapper implements IProviderResponseMapper<SanisResponse> {
	mapToSchoolDto(source: SanisResponse): ProvisioningSchoolOutputDto | undefined {
		return new ProvisioningSchoolOutputDto({
			name: source.personenkontexte[0].organisation.name,
			externalIdentifier: source.personenkontexte[0].organisation.orgid.toString(),
		});
	}

	mapToUserDto(source: SanisResponse, schoolId?: EntityId): ProvisioningUserOutputDto {
		return new ProvisioningUserOutputDto({
			firstName: source.person.name.vorname,
			lastName: source.person.name.familienname,
			roleNames: [RoleMapping[source.personenkontexte[0].rolle]],
			schoolId,
			externalId: source.pid,
		});
	}
}
