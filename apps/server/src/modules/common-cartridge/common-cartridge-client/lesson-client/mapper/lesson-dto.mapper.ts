import { LessonContentDto, LessonDto, LessonLinkedTaskDto, LessonMaterialsDto } from '../dto';
import {
	LessonContentResponse,
	LessonLinkedTaskResponse,
	LessonResponse,
	MaterialResponse,
} from '../lessons-api-client';

export class LessonDtoMapper {
	public static mapToLessonLinkedTaskDto(task: LessonLinkedTaskResponse): LessonLinkedTaskDto {
		const lessonLinkedTaskDto = new LessonLinkedTaskDto({
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

		return lessonLinkedTaskDto;
	}

	public static mapToLessonDto(lessonResponse: LessonResponse): LessonDto {
		const lessonDto = new LessonDto({
			lessonId: lessonResponse.id,
			name: lessonResponse.name,
			courseId: lessonResponse.courseId,
			courseGroupId: lessonResponse.courseGroupId,
			hidden: lessonResponse.hidden,
			position: lessonResponse.position,
			contents: lessonResponse.contents.map((content) => this.mapToLessenContentDto(content)),
			materials: lessonResponse.materials.map((material) => this.mapToLessonMaterialDto(material)),
		});

		return lessonDto;
	}

	private static mapToLessonMaterialDto(materialResponse: MaterialResponse): LessonMaterialsDto {
		const lessonMaterialsDto = new LessonMaterialsDto({
			materialsId: materialResponse.id,
			title: materialResponse.title,
			relatedResources: materialResponse.relatedResources.map((resource) => resource),
			url: materialResponse.url,
			client: materialResponse.client,
			license: materialResponse.license,
			merlinReference: materialResponse.merlinReference,
		});

		return lessonMaterialsDto;
	}

	private static mapToLessenContentDto(lessonContentResponse: LessonContentResponse): LessonContentDto {
		const lessonContentDto = new LessonContentDto({
			content: lessonContentResponse.content,
			title: lessonContentResponse.title,
			component: lessonContentResponse.component,
			hidden: lessonContentResponse.hidden,
		});

		return lessonContentDto;
	}
}
