import { Page } from '@shared/domain/domainobject';
import { CourseListResponse, CourseResponse } from '../controller/dto/response';
import { CourseInfoDto } from '../uc/dto';

export class CourseResponseMapper {
	public static mapToCourseInfoListResponse(
		courseInfos: Page<CourseInfoDto>,
		skip?: number,
		limit?: number
	): CourseListResponse {
		const courseInfoResponses: CourseResponse[] = courseInfos.data.map((courseInfo) =>
			this.mapToCourseInfoResponse(courseInfo)
		);

		const response: CourseListResponse = new CourseListResponse(courseInfoResponses, courseInfos.total, skip, limit);

		return response;
	}

	private static mapToCourseInfoResponse(courseInfo: CourseInfoDto): CourseResponse {
		const courseInfoResponse: CourseResponse = new CourseResponse({
			id: courseInfo.id,
			name: courseInfo.name,
			classNames: courseInfo.classes,
			teacherNames: courseInfo.teachers,
			syncedGroup: courseInfo.syncedWithGroup ? courseInfo.syncedWithGroup : undefined,
		});

		return courseInfoResponse;
	}
}
