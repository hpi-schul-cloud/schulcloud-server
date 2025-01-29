import { ComponentLernstorePropsImpl, LessonResources } from '../lessons-api-client';

export class ComponentLernstorePropsDto {
	public resources: LessonResources[];

	constructor(lernstoreContent: ComponentLernstorePropsImpl) {
		this.resources = lernstoreContent.resources;
	}
}
