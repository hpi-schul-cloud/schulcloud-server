import { SchoolEntity } from '@modules/school/repo';
import { SchoolInfoResponse } from '../dto';

export class SchoolInfoMapper {
	public static mapToResponse(schoolInfo: SchoolEntity): SchoolInfoResponse {
		const dto = new SchoolInfoResponse({ id: schoolInfo.id, name: schoolInfo.name });
		return dto;
	}
}
