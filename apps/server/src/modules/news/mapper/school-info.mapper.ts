import { SchoolEntity } from '@shared/domain/entity/school.entity';
import { SchoolInfoResponse } from '../controller/dto/school-info.response';

export class SchoolInfoMapper {
	static mapToResponse(schoolInfo: SchoolEntity): SchoolInfoResponse {
		const dto = new SchoolInfoResponse({ id: schoolInfo.id, name: schoolInfo.name });
		return dto;
	}
}
