import { SchoolInfo } from '../entity';
import { SchoolInfoResponseDto } from '../controller/dto';

export class SchoolInfoMapper {
	static mapToResponse(schoolInfo: SchoolInfo): SchoolInfoResponseDto {
		if (schoolInfo != null) {
			const dto = new SchoolInfoResponseDto();
			dto.id = schoolInfo.id;
			dto.name = schoolInfo.name;
			return dto;
		}
		return null;
	}
}
