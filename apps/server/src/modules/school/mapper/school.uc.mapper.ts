import { ProvisioningSchoolOutputDto } from '@src/modules/provisioning/dto/provisioning-school-output.dto';
import { SchoolDO } from '@shared/domain/domainobject/school.do';

export class SchoolUcMapper {
	static mapFromProvisioningSchoolOutputDtoToSchoolDO(dto: ProvisioningSchoolOutputDto) {
		return new SchoolDO({
			id: dto.id,
			name: dto.name,
			externalId: dto.externalId,
			systems: dto.systemIds,
		});
	}
}
