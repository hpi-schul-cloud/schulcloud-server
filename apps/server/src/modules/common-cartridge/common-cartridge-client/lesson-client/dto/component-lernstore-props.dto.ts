import { LernstoreResourcesDto } from './lernstore-resources.dto';

export class ComponentLernstorePropsDto {
	public resources: LernstoreResourcesDto[];

	constructor(resources: LernstoreResourcesDto[]) {
		this.resources = resources;
	}
}
