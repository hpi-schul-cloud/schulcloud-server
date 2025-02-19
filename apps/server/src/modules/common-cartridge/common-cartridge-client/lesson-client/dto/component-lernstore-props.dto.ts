import { ComponentLernstorePropsImpl } from '../lessons-api-client';
import { LernstoreResourcesDto } from './lernstore-resources.dto';

export class ComponentLernstorePropsDto {
	public resources: LernstoreResourcesDto[];

	constructor(lernstoreContent: ComponentLernstorePropsImpl) {
		this.resources = [];
		for (const resource of lernstoreContent.resources) {
			this.resources.push(new LernstoreResourcesDto(resource));
		}
	}
}
