import { ComponentLernstorePropsImpl } from '../lessons-api-client';

export class ComponentLernstorePropsDto {
	resources!: string[];

	constructor(lernstoreContent: ComponentLernstorePropsImpl) {
		this.resources = lernstoreContent.resources;
	}
}
