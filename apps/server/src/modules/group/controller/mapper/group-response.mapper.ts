import { Page } from '@shared/domain/domainobject/page';
import { ClassInfoDto } from '../../uc/dto/class-info.dto';
import { ClassInfoSearchListResponse } from '../dto/response/class-info-search-list.response';
import { ClassInfoResponse } from '../dto/response/class-info.response';

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
			id: classInfo.id,
			type: classInfo.type,
			name: classInfo.name,
			externalSourceName: classInfo.externalSourceName,
			teachers: classInfo.teachers,
			schoolYear: classInfo.schoolYear,
		});

		return mapped;
	}
}
