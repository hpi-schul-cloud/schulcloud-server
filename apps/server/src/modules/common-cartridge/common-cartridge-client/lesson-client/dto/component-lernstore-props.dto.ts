import { ComponentLernstorePropsImpl } from '../lessons-api-client';
import { LessonResourcesDto } from './lesson-resources.dto';

export class ComponentLernstorePropsDto {
	public resources: LessonResourcesDto[];

	constructor(lernstoreContent: ComponentLernstorePropsImpl) {
		this.resources = [];
		for (const resource of lernstoreContent.resources) {
			this.resources.push(new LessonResourcesDto(resource));
		}
	}
}
