import { Page } from '@shared/domain';
import { ClassInfoDto } from '../../uc/dto';
import { ClassInfoResponse, ClassInfoSearchListResponse } from '../dto';

export class GroupResponseMapper {
	static mapToClassInfosToListResponse(
		classInfos: Page<ClassInfoDto>,
		skip?: number,
		limit?: number
	): ClassInfoSearchListResponse {
		const mappedData: ClassInfoResponse[] = classInfos.data.map((classInfo) =>
			this.mapToClassInfoToResponse(classInfo)
		);

		const response: ClassInfoSearchListResponse = new ClassInfoSearchListResponse(
			mappedData,
			classInfos.total,
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
