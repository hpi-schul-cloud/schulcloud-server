import { LegacySchoolDo } from '@shared/domain/domainobject';
import { AdminApiSchoolCreateNoIdErrorLoggable } from '../loggable/admin-api-school-create-no-id-error.loggable';
import { AdminApiSchoolCreateResponseDto } from './dto/response/admin-api-school-create.response.dto';

export class AdminApiSchoolMapper {
	static mapSchoolDoToSchoolCreatedResponse(school: LegacySchoolDo) {
		if (school.id === undefined) {
			/* istanbul ignore next */
			throw new AdminApiSchoolCreateNoIdErrorLoggable();
		}

		const dto = new AdminApiSchoolCreateResponseDto({ id: school.id, name: school.name });

		return dto;
	}
}
