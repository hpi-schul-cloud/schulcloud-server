import { ComponentGeogebraPropsImpl } from '../lessons-api-client';

export class ComponentGeogebraPropsDto {
	materialId!: string;

	constructor(geogebraContent: ComponentGeogebraPropsImpl) {
		this.materialId = geogebraContent.materialId;
	}
}
