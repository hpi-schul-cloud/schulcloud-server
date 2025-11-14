import { LessonContentDto, LessonDto, LessonLinkedTaskDto, LessonMaterialsDto } from '../dto';
import { ComponentEtherpadPropsDto } from '../dto/component-etherpad-props.dto';
import { ComponentGeogebraPropsDto } from '../dto/component-geogebra-props.dto';
import { ComponentInternalPropsDto } from '../dto/component-internal-props.dto';
import { ComponentLernstorePropsDto } from '../dto/component-lernstore-props.dto';
import { ComponentTextPropsDto } from '../dto/component-text-props.dto';
import { LernstoreResourcesDto } from '../dto/lernstore-resources.dto';
import {
	ComponentEtherpadPropsImpl,
	ComponentGeogebraPropsImpl,
	ComponentInternalPropsImpl,
	ComponentLernstorePropsImpl,
	ComponentTextPropsImpl,
	LessonContentResponse,
	LessonContentResponseComponentEnum,
	LessonLinkedTaskResponse,
	LessonResponse,
	MaterialResponse,
} from '../lessons-api-client';

export class LessonDtoMapper {
	public static mapToLessonLinkedTaskDto(task: LessonLinkedTaskResponse): LessonLinkedTaskDto {
		const lessonLinkedTaskDto = new LessonLinkedTaskDto(task);

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
				.map((content) => this.mapToLessonContentDto(content))
				.filter((contentDto): contentDto is LessonContentResponse => contentDto !== null),
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
		});

		return lessonMaterialsDto;
	}

	private static mapToLessonContentDto(lessonContentResponse: LessonContentResponse): LessonContentDto | null {
		switch (lessonContentResponse.component) {
			case LessonContentResponseComponentEnum.Text:
				return new LessonContentDto({
					id: lessonContentResponse.id,
					title: lessonContentResponse.title,
					component: lessonContentResponse.component,
					hidden: lessonContentResponse.hidden,
					content: new ComponentTextPropsDto(lessonContentResponse.content as ComponentTextPropsImpl),
				});
			case LessonContentResponseComponentEnum.Etherpad:
				return new LessonContentDto({
					id: lessonContentResponse.id,
					title: lessonContentResponse.title,
					component: lessonContentResponse.component,
					hidden: lessonContentResponse.hidden,
					content: new ComponentEtherpadPropsDto(lessonContentResponse.content as ComponentEtherpadPropsImpl),
				});
			case LessonContentResponseComponentEnum.GeoGebra:
				return new LessonContentDto({
					id: lessonContentResponse.id,
					title: lessonContentResponse.title,
					component: lessonContentResponse.component,
					hidden: lessonContentResponse.hidden,
					content: new ComponentGeogebraPropsDto(lessonContentResponse.content as ComponentGeogebraPropsImpl),
				});
			case LessonContentResponseComponentEnum.Internal:
				return new LessonContentDto({
					id: lessonContentResponse.id,
					title: lessonContentResponse.title,
					component: lessonContentResponse.component,
					hidden: lessonContentResponse.hidden,
					content: new ComponentInternalPropsDto(lessonContentResponse.content as ComponentInternalPropsImpl),
				});
			case LessonContentResponseComponentEnum.Resources:
				return new LessonContentDto({
					id: lessonContentResponse.id,
					title: lessonContentResponse.title,
					component: lessonContentResponse.component,
					hidden: lessonContentResponse.hidden,
					content: this.mapContentOfLernstoreElement(lessonContentResponse),
				});
			default:
				return null;
		}
	}

	private static mapContentOfLernstoreElement(
		lessonContentResponse: LessonContentResponse
	): ComponentLernstorePropsDto {
		if (!lessonContentResponse.content) {
			return new ComponentLernstorePropsDto([]);
		}

		const lernstoreContents = lessonContentResponse.content as ComponentLernstorePropsImpl;
		const resources = lernstoreContents.resources.map((resource) => new LernstoreResourcesDto(resource));

		return new ComponentLernstorePropsDto(resources);
	}
}
