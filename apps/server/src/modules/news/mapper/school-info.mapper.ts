import { School } from '@shared/domain';
import { SchoolInfoResponse } from '../controller/dto';

export class SchoolInfoMapper {
	static mapToResponse(schoolInfo: School): SchoolInfoResponse {
		const dto = new SchoolInfoResponse({
			id: schoolInfo.id,
			name: schoolInfo.name,
		});
		return dto;
	}
}
