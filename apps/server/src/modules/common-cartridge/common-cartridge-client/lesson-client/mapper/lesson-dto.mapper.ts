import { LessonContentDto, LessonDto, LessonLinkedTaskDto, LessonMaterialsDto } from '../dto';
import {
	LessonContentResponse,
	LessonLinkedTaskResponse,
	LessonResponse,
	MaterialResponse,
} from '../lessons-api-client';

export class LessonDtoMapper {
	public static mapToLessonLinkedTaskDto(task: LessonLinkedTaskResponse): LessonLinkedTaskDto {
		return new LessonLinkedTaskDto({
			name: task.name,
			description: task.description,
			descriptionInputFormat: task.descriptionInputFormat,
			availableDate: task.availableDate,
			dueDate: task.dueDate,
			private: task.private,
			publicSubmissions: task.publicSubmissions,
			teamSubmissions: task.teamSubmissions,
			courseId: task.courseId,
			creator: task.creator,
			submissionIds: task.submissionIds,
			finishedIds: task.finishedIds,
		});
	}

	public static mapToLessonDto(lessonResponse: LessonResponse): LessonDto {
		return new LessonDto({
			_id: lessonResponse._id,
			lessonId: lessonResponse.id,
			name: lessonResponse.name,
			courseId: lessonResponse.courseId,
			courseGroupId: lessonResponse.courseGroupId,
			hidden: lessonResponse.hidden,
			position: lessonResponse.position,
			contents: lessonResponse.contents.map((content) => this.mapToLessenContentDto(content)),
			materials: lessonResponse.materials.map((material) => this.mapToLessonMaterialDto(material)),
		});
	}

	private static mapToLessonMaterialDto(materialResponse: MaterialResponse): LessonMaterialsDto {
		return new LessonMaterialsDto({
			_id: materialResponse._id,
			materialsId: materialResponse.id,
			title: materialResponse.title,
			relatedResources: materialResponse.relatedResources.map((resource) => resource),
			url: materialResponse.url,
			client: materialResponse.client,
			license: materialResponse.license,
			merlinReference: materialResponse.merlinReference,
		});
	}

	private static mapToLessenContentDto(lessonContentResponse: LessonContentResponse) {
		return new LessonContentDto({
			content: lessonContentResponse.content,
			_id: lessonContentResponse._id,
			contentId: lessonContentResponse.id,
			title: lessonContentResponse.title,
			component: lessonContentResponse.component,
			hidden: lessonContentResponse.hidden,
		});
	}
}
