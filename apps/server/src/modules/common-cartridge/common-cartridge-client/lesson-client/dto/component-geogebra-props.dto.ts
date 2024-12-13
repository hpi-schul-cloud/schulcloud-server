import { ComponentGeogebraPropsImpl } from '../lessons-api-client';

export class ComponentGeogebraPropsDto {
	public materialId: string;

	constructor(geogebraContent: ComponentGeogebraPropsImpl) {
		this.materialId = geogebraContent.materialId;
	}
}
