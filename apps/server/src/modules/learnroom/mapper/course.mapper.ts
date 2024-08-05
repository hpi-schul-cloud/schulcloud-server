import { Course } from '@shared/domain/entity';
import { LearnroomMetadata } from '@shared/domain/types';
import { CourseMetadataResponse } from '../controller/dto';

export class CourseMapper {
	static mapToMetadataResponse(course: Course): CourseMetadataResponse {
		const courseMetadata: LearnroomMetadata = course.getMetadata();
		const dto = new CourseMetadataResponse(
			courseMetadata.id,
			courseMetadata.title,
			courseMetadata.shortTitle,
			courseMetadata.displayColor,
			courseMetadata.startDate,
			courseMetadata.untilDate,
			courseMetadata.copyingSince,
			courseMetadata.syncedWithGroup?.id
		);
		return dto;
	}
}
