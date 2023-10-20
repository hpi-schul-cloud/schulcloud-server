import { Course } from '@shared/domain';
import { CourseMetadataResponse, CourseResponse } from '../controller/dto';

export class CourseMapper {
	static mapToMetadataResponse(course: Course): CourseMetadataResponse {
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

	static mapToCourseResponse(course: Course): CourseResponse {
		const dto = new CourseResponse(course);
		return dto;
	}
}
