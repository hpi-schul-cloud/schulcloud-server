import { LessonEntity } from '@shared/domain/entity';
import { LessonMetadataResponse, LessonResponse } from '../dto';

export class LessonMapper {
	static mapToMetadataResponse(lesson: LessonEntity): LessonMetadataResponse {
		const dto = new LessonMetadataResponse({ _id: lesson.id, name: lesson.name });
		return dto;
	}

	static mapToResponse(lesson: LessonEntity): LessonMetadataResponse {
		const dto = new LessonResponse(lesson);
		return dto;
	}
}
