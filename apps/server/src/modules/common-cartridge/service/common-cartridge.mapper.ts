import sanitizeHtml from 'sanitize-html';
import { CourseCommonCartridgeMetadataDto } from '../common-cartridge-client/course-client';
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
					html: `<h1>${lessonContent.title}</h1><p>${lessonContent.content.toString()}</p>`,
					intendedUse: CommonCartridgeIntendedUseType.UNSPECIFIED,
				};
			case LessonContentDtoComponentValues.GEO_GEBRA:
				return {
					type: CommonCartridgeResourceType.WEB_LINK,
					identifier: createIdentifier(lessonContent.id),
					title: lessonContent.title,
					// TODO - check if the url is correct
					url: `${CommonCartridgeExportMapper.GEOGEBRA_BASE_URL}/m/${lessonContent.content.toString()}`,
				};
			case LessonContentDtoComponentValues.ETHERPAD:
				return {
					type: CommonCartridgeResourceType.WEB_LINK,
					identifier: createIdentifier(lessonContent.id),
					// TODO - better solution for title
					title: `${lessonContent.title} - ${lessonContent.content.toString()}`,
					// TODO better solution for url
					url: lessonContent.content.toString(),
				};
			case LessonContentDtoComponentValues.LERNSTORE:
				return {
					type: CommonCartridgeResourceType.WEB_LINK,
					identifier: createIdentifier(lessonContent.id),
					title: lessonContent.title,
					// TODO better solution for url
					url: lessonContent.content.toString(),
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

	private getTextTitle(text: string): string {
		const title = sanitizeHtml(text, {
			allowedTags: [],
			allowedAttributes: {},
		}).slice(0, 50);

		return title;
	}
}
