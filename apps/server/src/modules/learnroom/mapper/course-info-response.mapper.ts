import { Page } from '@shared/domain/domainobject';
import { ClassInfoResponse, CourseInfoListResponse, CourseInfoResponse } from '../controller/dto/response';
import { ClassInfoDto, CourseInfoDto } from '../uc/dto';

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
			classes: courseInfo.classes,
			teacherNames: courseInfo.teacherNames,
			schoolYear: courseInfo.schoolYear,
			studentCount: courseInfo.studentCount,
			syncedGroup: courseInfo.syncedGroup ? this.mapToClassInfoResponse(courseInfo.syncedGroup) : undefined,
		});

		return courseInfoResponse;
	}

	private static mapToClassInfoResponse(classInfoDto: ClassInfoDto): ClassInfoResponse {
		const classInfoResponse: ClassInfoResponse = new ClassInfoResponse({
			id: classInfoDto.id,
			name: classInfoDto.name,
		});

		return classInfoResponse;
	}
}
