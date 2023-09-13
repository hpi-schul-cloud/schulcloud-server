import { ClassInfoDto } from '../../uc/dto/class-info.dto';
import { ClassInfoResponse, ClassInfoSearchListResponse } from '../dto';

export class GroupResponseMapper {
	static mapToClassInfosToListResponse(
		classInfos: ClassInfoDto[],
		skip?: number,
		limit?: number
	): ClassInfoSearchListResponse {
		const mappedData: ClassInfoResponse[] = classInfos.map((classInfo) => this.mapToClassInfoToResponse(classInfo));

		const response: ClassInfoSearchListResponse = new ClassInfoSearchListResponse(
			mappedData,
			mappedData.length,
			skip,
			limit
		);

		return response;
	}

	private static mapToClassInfoToResponse(classInfo: ClassInfoDto): ClassInfoResponse {
		const mapped = new ClassInfoResponse({
			name: classInfo.name,
			externalSourceName: classInfo.externalSourceName,
			teachers: classInfo.teachers,
		});

		return mapped;
	}
}
