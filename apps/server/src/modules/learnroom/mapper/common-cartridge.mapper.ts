import { LinkElement, RichTextElement } from '@modules/board/domain';
import {
	CommonCartridgeElementProps,
	CommonCartridgeElementType,
	CommonCartridgeFileBuilderProps,
	CommonCartridgeIntendedUseType,
	CommonCartridgeOrganizationBuilderOptions,
	CommonCartridgeResourceProps,
	CommonCartridgeResourceType,
	CommonCartridgeVersion,
	createIdentifier,
} from '@modules/common-cartridge';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ComponentProperties, ComponentType, Course, LessonEntity, Task } from '@shared/domain/entity';
import { LearnroomConfig } from '../learnroom.config';

@Injectable()
export class CommonCartridgeMapper {
	constructor(private readonly configService: ConfigService<LearnroomConfig, true>) {}

	public mapCourseToMetadata(course: Course): CommonCartridgeElementProps {
		return {
			type: CommonCartridgeElementType.METADATA,
			title: course.name,
			copyrightOwners: course.teachers.toArray().map((teacher) => `${teacher.firstName} ${teacher.lastName}`),
			creationDate: course.createdAt,
		};
	}

	public mapLessonToOrganization(lesson: LessonEntity): CommonCartridgeOrganizationBuilderOptions {
		return {
			identifier: createIdentifier(lesson.id),
			title: lesson.name,
		};
	}

	public mapContentToOrganization(content: ComponentProperties): CommonCartridgeOrganizationBuilderOptions {
		return {
			identifier: createIdentifier(content._id),
			title: content.title,
		};
	}

	public mapTaskToOrganization(task: Task): CommonCartridgeOrganizationBuilderOptions {
		return {
			identifier: createIdentifier(),
			title: task.name,
		};
	}

	public mapTaskToResource(task: Task, version: CommonCartridgeVersion): CommonCartridgeResourceProps {
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
			html: `<h1>${task.name}</h1><p>${task.description}</p>`,
			intendedUse,
		};
	}

	public mapContentToResources(
		content: ComponentProperties
	): CommonCartridgeResourceProps | CommonCartridgeResourceProps[] {
		switch (content.component) {
			case ComponentType.TEXT:
				return {
					type: CommonCartridgeResourceType.WEB_CONTENT,
					identifier: createIdentifier(content._id),
					title: content.title,
					html: `<h1>${content.title}</h1><p>${content.content.text}</p>`,
					intendedUse: CommonCartridgeIntendedUseType.UNSPECIFIED,
				};
			case ComponentType.GEOGEBRA:
				return {
					type: CommonCartridgeResourceType.WEB_LINK,
					identifier: createIdentifier(content._id),
					title: content.title,
					url: `${this.configService.getOrThrow<string>('GEOGEBRA_BASE_URL')}/m/${content.content.materialId}`,
				};
			case ComponentType.ETHERPAD:
				return {
					type: CommonCartridgeResourceType.WEB_LINK,
					identifier: createIdentifier(content._id),
					title: `${content.title} - ${content.content.description}`,
					url: content.content.url,
				};
			case ComponentType.LERNSTORE:
				return (
					content.content?.resources.map((resource) => {
						return {
							type: CommonCartridgeResourceType.WEB_LINK,
							identifier: createIdentifier(),
							title: resource.title,
							url: resource.url,
						};
					}) || []
				);
			default:
				return [];
		}
	}

	public mapCourseToManifest(version: CommonCartridgeVersion, course: Course): CommonCartridgeFileBuilderProps {
		return {
			version,
			identifier: createIdentifier(course.id),
		};
	}

	public mapRichTextElementToResource(element: RichTextElement): CommonCartridgeResourceProps {
		return {
			type: CommonCartridgeResourceType.WEB_CONTENT,
			title: this.getTextTitle(element.text),
			identifier: createIdentifier(element.id),
			html: `<p>${element.text}</p>`,
			intendedUse: CommonCartridgeIntendedUseType.UNSPECIFIED,
		};
	}

	public mapLinkElementToResource(element: LinkElement): CommonCartridgeResourceProps {
		return {
			type: CommonCartridgeResourceType.WEB_LINK,
			identifier: createIdentifier(element.id),
			title: element.title,
			url: element.url,
		};
	}

	private getTextTitle(text: string): string {
		const title = text
			.slice(0, 50)
			.replace(/<[^>]*>?/gm, '')
			.concat('...');
		return title;
	}
}
