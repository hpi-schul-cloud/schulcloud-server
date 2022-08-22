import { ProvisioningSchoolOutputDto } from '@src/modules/provisioning/dto/provisioning-school-output.dto';
import { SchoolDto } from '@src/modules/school/uc/dto/school.dto';

export class SchoolUcMapper {
	static mapFromProvisioningSchoolOutputDtoToSchoolDto(dto: ProvisioningSchoolOutputDto) {
		return new SchoolDto({
			id: dto.id,
			name: dto.name,
			externalId: dto.externalId,
			systemIds: dto.systemIds,
		});
	}
}
