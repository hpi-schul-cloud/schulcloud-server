import { ComponentProperties, ComponentType, Course, LessonEntity, Task } from '@shared/domain';
import { ObjectId } from 'bson';
import {
	CommonCartridgeMetadataElementProps,
	CommonCartridgeOrganizationBuilderOptions,
	CommonCartridgeResourceProps,
	CommonCartridgeResourceType,
	OmitVersion,
} from '../common-cartridge';

export class CommonCartridgeMapper {
	static mapCourseToMetadata(course: Course): OmitVersion<CommonCartridgeMetadataElementProps> {
		return {
			title: course.name,
			copyrightOwners: course.teachers.toArray().map((teacher) => `${teacher.firstName} ${teacher.lastName}`),
			creationDate: course.createdAt,
		};
	}

	static mapLessonToOrganization(lesson: LessonEntity): OmitVersion<CommonCartridgeOrganizationBuilderOptions> {
		return {
			identifier: lesson.id,
			title: lesson.name,
		};
	}

	static mapContentToOrganization(
		content: ComponentProperties
	): OmitVersion<CommonCartridgeOrganizationBuilderOptions> {
		return {
			identifier: new ObjectId(content._id).toHexString(),
			title: content.title,
		};
	}

	static mapTaskToResource(task: Task): CommonCartridgeResourceProps {
		return {
			type: CommonCartridgeResourceType.WEB_CONTENT,
			identifier: task.id,
			title: task.name,
			html: `<h1>${task.name}</h1><p>${task.description}</p>`,
		};
	}

	static mapContentToResources(
		content: ComponentProperties
	): CommonCartridgeResourceProps | CommonCartridgeResourceProps[] {
		switch (content.component) {
			case ComponentType.TEXT:
				return {
					type: CommonCartridgeResourceType.WEB_CONTENT,
					identifier: new ObjectId(content._id).toHexString(),
					title: content.title,
					html: `<h1>${content.title}</h1><p>${content.content.text}</p>`,
				};
			case ComponentType.GEOGEBRA:
				return {
					type: CommonCartridgeResourceType.WEB_LINK,
					identifier: new ObjectId(content._id).toHexString(),
					title: content.title,
					// TODO: put into environment, talk to capcakes if geogebra has been moved to tools, maybe there is a url in the data by now
					url: `https://www.geogebra.org/m/${content.content.materialId}`, // FIXME: hardcoded hostname
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
