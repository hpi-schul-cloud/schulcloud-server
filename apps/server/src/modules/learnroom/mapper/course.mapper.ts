import { CourseEntity } from '@modules/course/repo';
import { CourseMetadataResponse, CreateCourseResponse } from '../controller/dto';
import { CourseCommonCartridgeMetadataResponse } from '../controller/dto/course-cc-metadata.response';

export class CourseMapper {
	public static mapToMetadataResponse(course: CourseEntity): CourseMetadataResponse {
		const courseMetadata = course.getMetadata();
		const dto = new CourseMetadataResponse(
			courseMetadata.id,
			courseMetadata.title,
			courseMetadata.shortTitle,
			courseMetadata.displayColor,
			courseMetadata.startDate,
			courseMetadata.untilDate,
			courseMetadata.copyingSince
		);

		return dto;
	}

	public static mapToCommonCartridgeMetadataResponse(course: CourseEntity): CourseCommonCartridgeMetadataResponse {
		const courseMetadata = course.getMetadata();
		const teachers = course.teachers.toArray().map((teacher) => `${teacher.firstName} ${teacher.lastName}`);
		const courseCCMetadataResopne: CourseCommonCartridgeMetadataResponse = new CourseCommonCartridgeMetadataResponse(
			courseMetadata.id,
			courseMetadata.title,
			teachers,
			courseMetadata.startDate
		);

		return courseCCMetadataResopne;
	}

	public static mapToCreateCourseResponse(course: CourseEntity): CreateCourseResponse {
		const response = new CreateCourseResponse({ courseId: course.id });

		return response;
	}
}
