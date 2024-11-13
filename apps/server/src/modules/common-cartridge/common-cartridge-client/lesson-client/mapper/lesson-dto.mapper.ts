import { LessonContentDto, LessonDto, LessonLinkedTaskDto, LessonMaterialsDto } from '../dto';
import { ComponentEtherpadPropsDto } from '../dto/component-etherpad-props.dto';
import { ComponentGeogebraPropsDto } from '../dto/component-geogebra-props.dto';
import { ComponentInternalPropsDto } from '../dto/component-internal-props.dto';
import { ComponentLernstorePropsDto } from '../dto/component-lernstore-props.dto';
import { ComponentNexboardPropsDto } from '../dto/component-nexboard-props-dto';
import { ComponentTextPropsDto } from '../dto/component-text-props.dto';
import { LessonContentResponseContentInnerDto } from '../dto/lesson-content-response-inner.dto';
import {
	ComponentEtherpadPropsImpl,
	ComponentGeogebraPropsImpl,
	ComponentInternalPropsImpl,
	ComponentLernstorePropsImpl,
	ComponentNexboardPropsImpl,
	ComponentTextPropsImpl,
	LessonContentResponse,
	LessonContentResponseComponent,
	LessonContentResponseContentInner,
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
			id: lessonContentResponse.id,
			title: lessonContentResponse.title,
			component: lessonContentResponse.component,
			hidden: lessonContentResponse.hidden,
			content: lessonContentResponse.content.map((contentInner) =>
				this.mapToLessonContentResponseInner(lessonContentResponse.component, contentInner)
			),
		});

		return lessonContentDto;
	}

	private static mapToLessonContentResponseInner(
		component: LessonContentResponseComponent,
		contentResponseInner: LessonContentResponseContentInner
	): LessonContentResponseContentInnerDto {
		switch (component) {
			case LessonContentResponseComponent.TEXT:
				return new ComponentTextPropsDto(contentResponseInner as ComponentTextPropsImpl);
			case LessonContentResponseComponent.ETHERPAD:
				return new ComponentEtherpadPropsDto(contentResponseInner as ComponentEtherpadPropsImpl);
			case LessonContentResponseComponent.GEO_GEBRA:
				return new ComponentGeogebraPropsDto(contentResponseInner as ComponentGeogebraPropsImpl);
			case LessonContentResponseComponent.INTERNAL:
				return new ComponentInternalPropsDto(contentResponseInner as ComponentInternalPropsImpl);
			case LessonContentResponseComponent.RESOURCES:
				return new ComponentLernstorePropsDto(contentResponseInner as ComponentLernstorePropsImpl);
			case LessonContentResponseComponent.NE_XBOARD:
				return new ComponentNexboardPropsDto(contentResponseInner as ComponentNexboardPropsImpl);
			default:
				throw new Error(`Unknown component type of lesson content`);
		}
	}
}
