import { Page } from '@shared/domain/domainobject';
import { CourseInfoListResponse, CourseInfoResponse } from '../controller/dto/response';
import { CourseInfoDto } from '../uc/dto';

export class CourseInfoResponseMapper {
	public static mapToCourseInfoListResponse(
		courseInfos: Page<CourseInfoDto>,
		skip?: number,
		limit?: number
	): CourseInfoListResponse {
		const courseInfoResponses: CourseInfoResponse[] = courseInfos.data.map((courseInfo) =>
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

	private static mapToCourseInfoResponse(courseInfo: CourseInfoDto): CourseInfoResponse {
		const courseInfoResponse: CourseInfoResponse = new CourseInfoResponse({
			id: courseInfo.id,
			name: courseInfo.name,
			classNames: courseInfo.classes,
			teacherNames: courseInfo.teachers,
			courseStatus: courseInfo.courseStatus,
			syncedGroup: courseInfo.syncedWithGroup ? courseInfo.syncedWithGroup : undefined,
		});

		return courseInfoResponse;
	}
}
