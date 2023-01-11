import { ProvisioningSchoolOutputDto } from '@src/modules/provisioning/dto/provisioning-school-output.dto';
import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { PublicSchoolResponse } from '../controller/dto/public.school.response';

export class SchoolUcMapper {
	static mapFromProvisioningSchoolOutputDtoToSchoolDO(dto: ProvisioningSchoolOutputDto) {
		return new SchoolDO({
			id: dto.id,
			name: dto.name,
			externalId: dto.externalId,
			systems: dto.systemIds,
		});
	}

	static mapDOToPublicResponse(schoolDO: SchoolDO): PublicSchoolResponse {
		const response: PublicSchoolResponse = new PublicSchoolResponse({
			schoolName: schoolDO.name,
			schoolNumber: schoolDO.officialSchoolNumber ?? 'N/A',
			oauthMigrationPossible: schoolDO.oauthMigrationPossible ?? false,
			oauthMigrationMandatory: schoolDO.oauthMigrationMandatory ?? false,
		});
		return response;
	}
}
