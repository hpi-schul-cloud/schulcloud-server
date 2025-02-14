import { SchoolEntity } from '@modules/school/repo';
import { SchoolInfoResponse } from '../controller/dto';

export class SchoolInfoMapper {
	static mapToResponse(schoolInfo: SchoolEntity): SchoolInfoResponse {
		const dto = new SchoolInfoResponse({ id: schoolInfo.id, name: schoolInfo.name });
		return dto;
	}
}
