import { LessonContentDto, LessonDto, LessonLinkedTaskDto, LessonMaterialsDto } from '../dto';
import { ComponentEtherpadPropsDto } from '../dto/component-etherpad-props.dto';
import { ComponentGeogebraPropsDto } from '../dto/component-geogebra-props.dto';
import { ComponentInternalPropsDto } from '../dto/component-internal-props.dto';
import { ComponentLernstorePropsDto } from '../dto/component-lernstore-props.dto';
import { ComponentNexboardPropsDto } from '../dto/component-nexboard-props-dto';
import { ComponentTextPropsDto } from '../dto/component-text-props.dto';
import {
	ComponentEtherpadPropsImpl,
	ComponentGeogebraPropsImpl,
	ComponentInternalPropsImpl,
	ComponentLernstorePropsImpl,
	ComponentNexboardPropsImpl,
	ComponentTextPropsImpl,
	LessonContentResponse,
	LessonContentResponseComponent,
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
			contents: lessonResponse.contents
				.map((content) => this.mapToLessenContentDto(content))
				.filter((contetnDto) => contetnDto !== null),
			linkedTasks: [],
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

	private static mapToLessenContentDto(lessonContentResponse: LessonContentResponse): LessonContentDto | null {
		switch (lessonContentResponse.component) {
			case LessonContentResponseComponent.TEXT:
				return new LessonContentDto({
					id: lessonContentResponse.id,
					title: lessonContentResponse.title,
					component: lessonContentResponse.component,
					hidden: lessonContentResponse.hidden,
					content: new ComponentTextPropsDto(lessonContentResponse.content as ComponentTextPropsImpl),
				});
			case LessonContentResponseComponent.ETHERPAD:
				return new LessonContentDto({
					id: lessonContentResponse.id,
					title: lessonContentResponse.title,
					component: lessonContentResponse.component,
					hidden: lessonContentResponse.hidden,
					content: new ComponentEtherpadPropsDto(lessonContentResponse.content as ComponentEtherpadPropsImpl),
				});
			case LessonContentResponseComponent.GEO_GEBRA:
				return new LessonContentDto({
					id: lessonContentResponse.id,
					title: lessonContentResponse.title,
					component: lessonContentResponse.component,
					hidden: lessonContentResponse.hidden,
					content: new ComponentGeogebraPropsDto(lessonContentResponse.content as ComponentGeogebraPropsImpl),
				});
			case LessonContentResponseComponent.INTERNAL:
				return new LessonContentDto({
					id: lessonContentResponse.id,
					title: lessonContentResponse.title,
					component: lessonContentResponse.component,
					hidden: lessonContentResponse.hidden,
					content: new ComponentInternalPropsDto(lessonContentResponse.content as ComponentInternalPropsImpl),
				});
			case LessonContentResponseComponent.RESOURCES:
				return new LessonContentDto({
					id: lessonContentResponse.id,
					title: lessonContentResponse.title,
					component: lessonContentResponse.component,
					hidden: lessonContentResponse.hidden,
					content: new ComponentLernstorePropsDto(lessonContentResponse.content as ComponentLernstorePropsImpl),
				});
			case LessonContentResponseComponent.NEX_BOARD:
				return new LessonContentDto({
					id: lessonContentResponse.id,
					title: lessonContentResponse.title,
					component: lessonContentResponse.component,
					hidden: lessonContentResponse.hidden,
					content: new ComponentNexboardPropsDto(lessonContentResponse.content as ComponentNexboardPropsImpl),
				});
			default:
				return null;
		}
	}
}
