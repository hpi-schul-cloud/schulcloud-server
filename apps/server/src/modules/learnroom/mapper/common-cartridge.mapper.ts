import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ComponentProperties, ComponentType, Course, LessonEntity, Task } from '@shared/domain/entity';
import { ObjectId } from 'bson';
import {
	CommonCartridgeElementProps,
	CommonCartridgeElementType,
	CommonCartridgeIntendedUseType,
	CommonCartridgeOrganizationBuilderOptions,
	CommonCartridgeResourceProps,
	CommonCartridgeResourceType,
} from '../../common-cartridge';
import { LearnroomConfig } from '../learnroom.config';

@Injectable()
export class CommonCartridgeMapper {
	public constructor(private readonly configService: ConfigService<LearnroomConfig, true>) {}

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
			identifier: lesson.id,
			title: lesson.name,
		};
	}

	public mapContentToOrganization(content: ComponentProperties): CommonCartridgeOrganizationBuilderOptions {
		return {
			identifier: new ObjectId(content._id).toHexString(),
			title: content.title,
		};
	}

	public mapTaskToOrganization(task: Task): CommonCartridgeOrganizationBuilderOptions {
		return {
			identifier: task.id,
			title: task.name,
		};
	}

	public mapTaskToResource(task: Task): CommonCartridgeResourceProps {
		return {
			type: CommonCartridgeResourceType.WEB_CONTENT,
			identifier: task.id,
			title: task.name,
			html: `<h1>${task.name}</h1><p>${task.description}</p>`,
			intendedUse: CommonCartridgeIntendedUseType.ASSIGNMENT,
		};
	}

	public mapContentToResources(
		content: ComponentProperties
	): CommonCartridgeResourceProps | CommonCartridgeResourceProps[] {
		switch (content.component) {
			case ComponentType.TEXT:
				return {
					type: CommonCartridgeResourceType.WEB_CONTENT,
					identifier: new ObjectId(content._id).toHexString(),
					title: content.title,
					html: `<h1>${content.title}</h1><p>${content.content.text}</p>`,
					intendedUse: CommonCartridgeIntendedUseType.UNSPECIFIED,
				};
			case ComponentType.GEOGEBRA:
				return {
					type: CommonCartridgeResourceType.WEB_LINK,
					identifier: new ObjectId(content._id).toHexString(),
					title: content.title,
					url: `${this.configService.getOrThrow<string>(
						'FEATURE_COMMON_CARTRIDGE_COURSE_EXPORT_ENABLED'
					)}/m/${content.content.materialId}`,
				};
			case ComponentType.ETHERPAD:
				return {
					type: CommonCartridgeResourceType.WEB_LINK,
					identifier: new ObjectId(content._id).toHexString(),
					title: `${content.content.title} - ${content.content.description}`,
					url: content.content.url,
				};
			case ComponentType.LERNSTORE:
				return (
					content.content?.resources.map((resource) => {
						return {
							type: CommonCartridgeResourceType.WEB_LINK,
							identifier: new ObjectId().toHexString(),
							title: resource.description,
							url: resource.url,
						};
					}) || []
				);
			default:
				return [];
		}
	}
}
