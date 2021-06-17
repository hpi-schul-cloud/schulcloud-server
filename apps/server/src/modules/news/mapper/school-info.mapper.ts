import { SchoolInfo } from '../entity';
import { SchoolInfoResponse } from '../controller/dto';

export class SchoolInfoMapper {
	static mapToResponse(schoolInfo: SchoolInfo): SchoolInfoResponse {
		const dto = new SchoolInfoResponse();
		dto.id = schoolInfo.id;
		dto.name = schoolInfo.name;
		return dto;
	}
}
