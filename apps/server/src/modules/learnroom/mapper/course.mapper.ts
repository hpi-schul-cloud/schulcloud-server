import { Course } from '@shared/domain/entity';
import { CourseMetadataResponse } from '../controller/dto';
import { CourseCommonCartridgeMetadataResponse } from '../controller/dto/course-cc-metadata.response';

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

	static mapToCommonCartridgeMetadataResponse(course: Course): CourseCommonCartridgeMetadataResponse {
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
}
