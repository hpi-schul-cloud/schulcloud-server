import { FileDto } from '@src/modules/files-storage-client';
import sanitizeHtml from 'sanitize-html';
import { FileElementResponseDto } from '../common-cartridge-client/card-client/dto/file-element-response.dto';
import { LinkElementResponseDto } from '../common-cartridge-client/card-client/dto/link-element-response.dto';
import { RichTextElementResponseDto } from '../common-cartridge-client/card-client/dto/rich-text-element-response.dto';
import { CourseCommonCartridgeMetadataDto } from '../common-cartridge-client/course-client';
import {
	LessonContentDto,
	LessonContentDtoComponentValues,
	LessonDto,
	LessonLinkedTaskDto,
} from '../common-cartridge-client/lesson-client/dto';
import { ComponentEtherpadPropsDto } from '../common-cartridge-client/lesson-client/dto/component-etherpad-props.dto';
import { ComponentGeogebraPropsDto } from '../common-cartridge-client/lesson-client/dto/component-geogebra-props.dto';
import { ComponentLernstorePropsDto } from '../common-cartridge-client/lesson-client/dto/component-lernstore-props.dto';
import { ComponentTextPropsDto } from '../common-cartridge-client/lesson-client/dto/component-text-props.dto';
import { BoardTaskDto } from '../common-cartridge-client/room-client/dto/board-task.dto';
import { CommonCartridgeOrganizationProps } from '../export/builders/common-cartridge-file-builder';
import {
	CommonCartridgeElementType,
	CommonCartridgeIntendedUseType,
	CommonCartridgeResourceType,
	CommonCartridgeVersion,
} from '../export/common-cartridge.enums';
import { CommonCartridgeElementProps } from '../export/elements/common-cartridge-element-factory';
import { CommonCartridgeResourceProps } from '../export/resources/common-cartridge-resource-factory';
import { createIdentifier } from '../export/utils';

export class CommonCartridgeExportMapper {
	private static readonly GEOGEBRA_BASE_URL: string = 'https://geogebra.org';

	public mapCourseToManifestNew(
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
					html: `<h1>${lessonContent.title ?? ''}</h1><p>${
						(lessonContent.content as ComponentTextPropsDto).text ?? ''
					}</p>`,
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
					title: `${(lessonContent.content as ComponentEtherpadPropsDto).title} - ${
						(lessonContent.content as ComponentEtherpadPropsDto).description
					}`,
					url: (lessonContent.content as ComponentEtherpadPropsDto).url,
				};
			case LessonContentDtoComponentValues.LERNSTORE:
				return {
					type: CommonCartridgeResourceType.WEB_LINK,
					identifier: createIdentifier(lessonContent.id),
					title: (lessonContent.content as ComponentLernstorePropsDto).resources.join(', '),
					url: (lessonContent.content as ComponentLernstorePropsDto & { url: string }).url,
				};
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
		const intendedUse = (() => {
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
			html: `<h1>${task.name}</h1><p>${task.description ?? ''}</p>`,
			intendedUse,
		};
	}

	public mapLinkedTaskToResource(
		task: LessonLinkedTaskDto,
		version: CommonCartridgeVersion
	): CommonCartridgeResourceProps {
		const intendedUse = (() => {
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
			title: element.content.title,
			url: element.content.url,
		};
	}

	public mapFileElementToResource(
		file: { fileRecord: FileDto; file: Buffer },
		element?: FileElementResponseDto
	): CommonCartridgeResourceProps {
		return {
			type: CommonCartridgeResourceType.FILE,
			identifier: createIdentifier(element?.id),
			title: element?.content.caption || file.fileRecord.name,
			fileName: file.fileRecord.name,
			fileContent: file.file,
		};
	}

	private getTextTitle(text: string): string {
		const title = sanitizeHtml(text, {
			allowedTags: [],
			allowedAttributes: {},
		}).slice(0, 50);

		return title;
	}
}
