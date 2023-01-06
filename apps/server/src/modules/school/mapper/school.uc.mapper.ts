import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { PublicSchoolResponse } from '../controller/dto/public.school.response';

export class SchoolUcMapper {
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
