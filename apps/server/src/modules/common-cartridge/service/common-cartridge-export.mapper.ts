import {
	BoardTaskResponse,
	ComponentEtherpadPropsImpl,
	ComponentGeogebraPropsImpl,
	ComponentLernstorePropsImpl,
	ComponentTextPropsImpl,
	CourseCommonCartridgeMetadataResponse,
	FileElementResponse,
	FileFolderElementResponse,
	FileRecordResponse,
	LessonContentResponse,
	LessonContentResponseComponent,
	LessonLinkedTaskResponse,
	LessonResponse,
	LinkElementResponse,
	RichTextElementResponse,
} from '@infra/common-cartridge-clients';
import sanitizeHtml from 'sanitize-html';
import { Stream } from 'stream';
import { CommonCartridgeOrganizationProps } from '../export/builders/common-cartridge-file-builder';
import {
	CommonCartridgeElementType,
	CommonCartridgeIntendedUseType,
	CommonCartridgeResourceType,
	CommonCartridgeVersion,
} from '../export/common-cartridge.enums';
import { CommonCartridgeElementProps } from '../export/elements/common-cartridge-element-factory';
import { CommonCartridgeResourceProps } from '../export/resources/common-cartridge-resource-factory';
import { FileElement } from '../export/resources/v1.3.0/common-cartridge-file-folder-resource';
import { createIdentifier } from '../export/utils';
import { FileMetadataAndStream } from './common-cartridge-export.service';

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

	public mapCourseToMetadata(courseMetadata: CourseCommonCartridgeMetadataResponse): CommonCartridgeElementProps {
		return {
			type: CommonCartridgeElementType.METADATA,
			title: courseMetadata.title,
			copyrightOwners: courseMetadata.copyRightOwners,
			creationDate: courseMetadata.creationDate ? new Date(courseMetadata.creationDate) : new Date(),
		};
	}

	public mapLessonToOrganization(lesson: LessonResponse): CommonCartridgeOrganizationProps {
		return {
			identifier: createIdentifier(lesson.id),
			title: lesson.name,
		};
	}

	public mapContentToResources(
		lessonContent: LessonContentResponse
	): CommonCartridgeResourceProps | CommonCartridgeResourceProps[] {
		switch (lessonContent.component) {
			case LessonContentResponseComponent.TEXT:
				return {
					type: CommonCartridgeResourceType.WEB_CONTENT,
					identifier: createIdentifier(lessonContent.id),
					title: lessonContent.title,
					html: `<p>${(lessonContent.content as ComponentTextPropsImpl).text ?? ''}</p>`,
					intendedUse: CommonCartridgeIntendedUseType.UNSPECIFIED,
				};
			case LessonContentResponseComponent.GEO_GEBRA:
				return {
					type: CommonCartridgeResourceType.WEB_LINK,
					identifier: createIdentifier(lessonContent.id),
					title: lessonContent.title,
					url: `${CommonCartridgeExportMapper.GEOGEBRA_BASE_URL}/m/${
						(lessonContent.content as ComponentGeogebraPropsImpl).materialId
					}`,
				};
			case LessonContentResponseComponent.ETHERPAD:
				return {
					type: CommonCartridgeResourceType.WEB_LINK,
					identifier: createIdentifier(lessonContent.id),
					title: (lessonContent.content as ComponentEtherpadPropsImpl).description
						? `${lessonContent.title} - ${(lessonContent.content as ComponentEtherpadPropsImpl).description}`
						: lessonContent.title,
					url: (lessonContent.content as ComponentEtherpadPropsImpl).url,
				};
			case LessonContentResponseComponent.RESOURCES: {
				const { resources } = lessonContent.content as ComponentLernstorePropsImpl;
				return (
					resources.map((resource, index) => {
						return {
							type: CommonCartridgeResourceType.WEB_LINK,
							identifier: `${createIdentifier(lessonContent.id)}-${index}`,
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

	public mapContentToOrganization(content: LessonContentResponse): CommonCartridgeOrganizationProps {
		return {
			identifier: createIdentifier(content.id),
			title: content.title,
		};
	}

	public mapTaskToResource(task: BoardTaskResponse, version: CommonCartridgeVersion): CommonCartridgeResourceProps {
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
		task: LessonLinkedTaskResponse,
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

	public mapRichTextElementToResource(element: RichTextElementResponse): CommonCartridgeResourceProps {
		return {
			type: CommonCartridgeResourceType.WEB_CONTENT,
			identifier: createIdentifier(element.id),
			title: this.getTextTitle(element.content.text),
			html: `<p>${element.content.text}</p>`,
			intendedUse: CommonCartridgeIntendedUseType.UNSPECIFIED,
		};
	}

	public mapLinkElementToResource(element: LinkElementResponse): CommonCartridgeResourceProps {
		return {
			type: CommonCartridgeResourceType.WEB_LINK,
			identifier: createIdentifier(element.id),
			title: element.content.title ? element.content.title : element.content.url,
			url: element.content.url,
		};
	}

	public mapFileToResource(
		fileRecord: FileRecordResponse,
		file: Stream,
		element?: FileElementResponse
	): CommonCartridgeResourceProps {
		return {
			type: CommonCartridgeResourceType.FILE,
			identifier: createIdentifier(element?.id),
			title: element?.content.caption?.trim() ? element.content.caption : fileRecord.name,
			fileName: fileRecord.name,
			file,
		};
	}

	public mapFileFolderToResource(
		fileFolderElement: FileFolderElementResponse,
		fileFolderData: FileMetadataAndStream[]
	): CommonCartridgeResourceProps {
		return {
			type: CommonCartridgeResourceType.FILE_FOLDER,
			title: fileFolderElement.content.title,
			identifier: createIdentifier(fileFolderElement.id),
			files: fileFolderData.map((data): FileElement => {
				return {
					file: data.file,
					fileName: data.name,
				};
			}),
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
