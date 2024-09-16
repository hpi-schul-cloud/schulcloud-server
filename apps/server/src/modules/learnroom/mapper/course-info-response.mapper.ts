import { Page } from '@shared/domain/domainobject';
import { CourseInfoListResponse, CourseInfoDataResponse } from '../controller/dto/response';
import { CourseInfoDto } from '../uc/dto';

export class CourseInfoResponseMapper {
	public static mapToCourseInfoListResponse(
		courseInfos: Page<CourseInfoDto>,
		skip?: number,
		limit?: number
	): CourseInfoListResponse {
		const courseInfoResponses: CourseInfoDataResponse[] = courseInfos.data.map((courseInfo) =>
			this.mapToCourseInfoResponse(courseInfo)
		);

		const response: CourseInfoListResponse = new CourseInfoListResponse(
			courseInfoResponses,
			courseInfos.total,
			skip,
			limit
		);

		return response;
	}

	private static mapToCourseInfoResponse(courseInfo: CourseInfoDto): CourseInfoDataResponse {
		const courseInfoResponse: CourseInfoDataResponse = new CourseInfoDataResponse({
			id: courseInfo.id,
			name: courseInfo.name,
			classNames: courseInfo.classes,
			teacherNames: courseInfo.teachers,
			syncedGroup: courseInfo.syncedGroupName,
		});

		return courseInfoResponse;
	}
}
