import { ComponentLernstorePropsImpl } from '../lessons-api-client';
import { LernstoreResourcesDto } from './lernstore-resources.dto';

export class ComponentLernstorePropsDto {
	public resources: LernstoreResourcesDto[] = [];

	constructor(lernstoreContent: ComponentLernstorePropsImpl) {
		if (!lernstoreContent) {
			return;
		}
		this.resources = lernstoreContent.resources
			? lernstoreContent.resources.map((resource) => new LernstoreResourcesDto(resource))
			: [];
	}
}
