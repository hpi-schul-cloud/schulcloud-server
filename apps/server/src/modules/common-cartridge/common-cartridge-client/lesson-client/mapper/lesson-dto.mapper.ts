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
		switch (lessonContentResponse.component) {
			case LessonContentResponseComponent.TEXT:
				return new LessonContentDto({
					id: lessonContentResponse.id,
					title: lessonContentResponse.title,
					component: lessonContentResponse.component,
					hidden: lessonContentResponse.hidden,
					content: lessonContentResponse.content.map((contentInner) =>
						this.mapToComponentTextPropsDto(contentInner as ComponentTextPropsImpl)
					),
				});
			case LessonContentResponseComponent.ETHERPAD:
				return new LessonContentDto({
					id: lessonContentResponse.id,
					title: lessonContentResponse.title,
					component: lessonContentResponse.component,
					hidden: lessonContentResponse.hidden,
					content: lessonContentResponse.content.map((contentInner) =>
						this.mapToComponentEtherpadPropsDto(contentInner as ComponentEtherpadPropsImpl)
					),
				});
			case LessonContentResponseComponent.GEO_GEBRA:
				return new LessonContentDto({
					id: lessonContentResponse.id,
					title: lessonContentResponse.title,
					component: lessonContentResponse.component,
					hidden: lessonContentResponse.hidden,
					content: lessonContentResponse.content.map((contentInner) =>
						this.mapToComponentGeogebraPropsDto(contentInner as ComponentGeogebraPropsImpl)
					),
				});
			case LessonContentResponseComponent.INTERNAL:
				return new LessonContentDto({
					id: lessonContentResponse.id,
					title: lessonContentResponse.title,
					component: lessonContentResponse.component,
					hidden: lessonContentResponse.hidden,
					content: lessonContentResponse.content.map((contentInner) =>
						this.mapToComponentInternalPropsDto(contentInner as ComponentInternalPropsImpl)
					),
				});
			case LessonContentResponseComponent.RESOURCES:
				return new LessonContentDto({
					id: lessonContentResponse.id,
					title: lessonContentResponse.title,
					component: lessonContentResponse.component,
					hidden: lessonContentResponse.hidden,
					content: lessonContentResponse.content.map((contentInner) =>
						this.mapToComponentLernstorePropsDto(contentInner as ComponentLernstorePropsImpl)
					),
				});
			case LessonContentResponseComponent.NE_XBOARD:
				return new LessonContentDto({
					id: lessonContentResponse.id,
					title: lessonContentResponse.title,
					component: lessonContentResponse.component,
					hidden: lessonContentResponse.hidden,
					content: lessonContentResponse.content.map((contentInner) =>
						this.mapToComponentNexboardPropsDto(contentInner as ComponentNexboardPropsImpl)
					),
				});
			default:
				throw new Error(`Unknown component type of lesson content`);
		}
	}

	private static mapToComponentTextPropsDto(contentInner: ComponentTextPropsImpl): ComponentTextPropsDto {
		return new ComponentTextPropsDto(contentInner);
	}

	private static mapToComponentEtherpadPropsDto(contentInner: ComponentEtherpadPropsImpl): ComponentEtherpadPropsDto {
		return new ComponentEtherpadPropsDto(contentInner);
	}

	private static mapToComponentGeogebraPropsDto(contentInner: ComponentGeogebraPropsImpl): ComponentGeogebraPropsDto {
		return new ComponentGeogebraPropsDto(contentInner);
	}

	private static mapToComponentInternalPropsDto(contentInner: ComponentInternalPropsImpl): ComponentInternalPropsDto {
		return new ComponentInternalPropsDto(contentInner);
	}

	private static mapToComponentLernstorePropsDto(
		contentInner: ComponentLernstorePropsImpl
	): ComponentLernstorePropsDto {
		return new ComponentLernstorePropsDto(contentInner);
	}

	private static mapToComponentNexboardPropsDto(contentInner: ComponentNexboardPropsImpl): ComponentNexboardPropsDto {
		return new ComponentNexboardPropsDto(contentInner);
	}
}
