import sanitizeHtml from 'sanitize-html';
import { FileDto } from '@modules/files-storage-client';
import { CourseCommonCartridgeMetadataDto } from '@infra/courses-client/dto';
import {
	LessonContentDto,
	LessonContentDtoComponentValues,
	LessonDto,
	LessonLinkedTaskDto,
} from '../common-cartridge-client/lesson-client/dto';
import { CommonCartridgeOrganizationProps } from '../export/builders/common-cartridge-file-builder';
import {
	CommonCartridgeElementType,
	CommonCartridgeIntendedUseType,
	CommonCartridgeResourceType,
	CommonCartridgeVersion,
} from '../export/common-cartridge.enums';
import { CommonCartridgeElementProps } from '../export/elements/common-cartridge-element-factory';
import { createIdentifier } from '../export/utils';
import { CommonCartridgeResourceProps } from '../export/resources/common-cartridge-resource-factory';
import { BoardTaskDto } from '../common-cartridge-client/room-client/dto/board-task.dto';
import { RichTextElementResponseDto } from '../common-cartridge-client/card-client/dto/rich-text-element-response.dto';
import { LinkElementResponseDto } from '../common-cartridge-client/card-client/dto/link-element-response.dto';
import { ComponentTextPropsDto } from '../common-cartridge-client/lesson-client/dto/component-text-props.dto';
import { ComponentGeogebraPropsDto } from '../common-cartridge-client/lesson-client/dto/component-geogebra-props.dto';
import { ComponentLernstorePropsDto } from '../common-cartridge-client/lesson-client/dto/component-lernstore-props.dto';
import { ComponentEtherpadPropsDto } from '../common-cartridge-client/lesson-client/dto/component-etherpad-props.dto';
import { FileElementResponseDto } from '../common-cartridge-client/card-client/dto/file-element-response.dto';

export class CommonCartridgeExportMapper {
	private static readonly GEOGEBRA_BASE_URL: string = 'https://geogebra.org';

	public mapCourseToManifest(
		version: CommonCartridgeVersion,
		courseId: string
	): { version: CommonCartridgeVersion; identifier: string } {
		return {
			version,
			identifier: createIdentifier(courseId),
		};
	}

	public mapCourseToMetadata(courseMetadata: CourseCommonCartridgeMetadataDto): CommonCartridgeElementProps {
		return {
			type: CommonCartridgeElementType.METADATA,
			title: courseMetadata.title,
			copyrightOwners: courseMetadata.copyRightOwners,
			creationDate: courseMetadata.creationDate ? new Date(courseMetadata.creationDate) : new Date(),
		};
	}

	public mapLessonToOrganization(lesson: LessonDto): CommonCartridgeOrganizationProps {
		return {
			identifier: createIdentifier(lesson.lessonId),
			title: lesson.name,
		};
	}

	public mapContentToResources(
		lessonContent: LessonContentDto
	): CommonCartridgeResourceProps | CommonCartridgeResourceProps[] {
		switch (lessonContent.component) {
			case LessonContentDtoComponentValues.TEXT:
				return {
					type: CommonCartridgeResourceType.WEB_CONTENT,
					identifier: createIdentifier(lessonContent.id),
					title: lessonContent.title,
					html: `<p>${(lessonContent.content as ComponentTextPropsDto).text ?? ''}</p>`,
					intendedUse: CommonCartridgeIntendedUseType.UNSPECIFIED,
				};
			case LessonContentDtoComponentValues.GEO_GEBRA:
				return {
					type: CommonCartridgeResourceType.WEB_LINK,
					identifier: createIdentifier(lessonContent.id),
					title: lessonContent.title,
					url: `${CommonCartridgeExportMapper.GEOGEBRA_BASE_URL}/m/${
						(lessonContent.content as ComponentGeogebraPropsDto).materialId
					}`,
				};
			case LessonContentDtoComponentValues.ETHERPAD:
				return {
					type: CommonCartridgeResourceType.WEB_LINK,
					identifier: createIdentifier(lessonContent.id),
					title: (lessonContent.content as ComponentEtherpadPropsDto).description
						? `${lessonContent.title} - ${(lessonContent.content as ComponentEtherpadPropsDto).description}`
						: lessonContent.title,
					url: (lessonContent.content as ComponentEtherpadPropsDto).url,
				};
			case LessonContentDtoComponentValues.RESOURCES: {
				const { resources } = lessonContent.content as ComponentLernstorePropsDto;
				return (
					resources.map((resource) => {
						return {
							type: CommonCartridgeResourceType.WEB_LINK,
							identifier: createIdentifier(lessonContent.id),
							title: resource.title,
							url: resource.url || '',
						};
					}) || []
				);
			}
			default:
				return [];
		}
	}

	public mapContentToOrganization(content: LessonContentDto): CommonCartridgeOrganizationProps {
		return {
			identifier: createIdentifier(content.id),
			title: content.title,
		};
	}

	public mapTaskToResource(task: BoardTaskDto, version: CommonCartridgeVersion): CommonCartridgeResourceProps {
		const intendedUse = ((): CommonCartridgeIntendedUseType => {
			switch (version) {
				case CommonCartridgeVersion.V_1_1_0:
					return CommonCartridgeIntendedUseType.UNSPECIFIED;
				case CommonCartridgeVersion.V_1_3_0:
					return CommonCartridgeIntendedUseType.ASSIGNMENT;
				default:
					return CommonCartridgeIntendedUseType.UNSPECIFIED;
			}
		})();

		return {
			type: CommonCartridgeResourceType.WEB_CONTENT,
			identifier: createIdentifier(task.id),
			title: task.name,
			html: `<p>${task.description ?? ''}</p>`,
			intendedUse,
		};
	}

	public mapLinkedTaskToResource(
		task: LessonLinkedTaskDto,
		version: CommonCartridgeVersion
	): CommonCartridgeResourceProps {
		const intendedUse = ((): CommonCartridgeIntendedUseType => {
			switch (version) {
				case CommonCartridgeVersion.V_1_1_0:
					return CommonCartridgeIntendedUseType.UNSPECIFIED;
				case CommonCartridgeVersion.V_1_3_0:
					return CommonCartridgeIntendedUseType.ASSIGNMENT;
				default:
					return CommonCartridgeIntendedUseType.UNSPECIFIED;
			}
		})();

		return {
			type: CommonCartridgeResourceType.WEB_CONTENT,
			identifier: createIdentifier(),
			title: task.name,
			html: `<h1>${task.name}</h1><p>${task.description}</p>`,
			intendedUse,
		};
	}

	public mapRichTextElementToResource(element: RichTextElementResponseDto): CommonCartridgeResourceProps {
		return {
			type: CommonCartridgeResourceType.WEB_CONTENT,
			identifier: createIdentifier(element.id),
			title: this.getTextTitle(element.content.text),
			html: `<p>${element.content.text}</p>`,
			intendedUse: CommonCartridgeIntendedUseType.UNSPECIFIED,
		};
	}

	public mapLinkElementToResource(element: LinkElementResponseDto): CommonCartridgeResourceProps {
		return {
			type: CommonCartridgeResourceType.WEB_LINK,
			identifier: createIdentifier(element.id),
			title: element.content.title ? element.content.title : element.content.url,
			url: element.content.url,
		};
	}

	public mapFileToResource(
		fileRecord: FileDto,
		file: Buffer,
		element?: FileElementResponseDto
	): CommonCartridgeResourceProps {
		return {
			type: CommonCartridgeResourceType.FILE,
			identifier: createIdentifier(element?.id),
			title: element?.content.caption?.trim() ? element.content.caption : fileRecord.name,
			fileName: fileRecord.name,
			fileContent: file,
		};
	}

	private getTextTitle(text: string): string {
		const title = sanitizeHtml(text, {
			allowedTags: [],
			allowedAttributes: {},
		}).slice(0, 20);

		return title.length > 20 ? `${title}...` : title;
	}
}
