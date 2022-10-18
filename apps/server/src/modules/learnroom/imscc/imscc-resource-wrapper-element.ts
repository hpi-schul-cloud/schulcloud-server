import { IImsccElement } from './imscc-element.interface';
import { ImsccResourceElement } from './imscc-resource-element';

export class ImsccResourceWrapperElement implements IImsccElement {
	constructor(private readonly resourceElements: ImsccResourceElement[]) {}

	transform(): Record<string, unknown> {
		return {
			resource: this.resourceElements.map((resourceElement) => {
				return resourceElement.transform();
			}),
		};
	}
}
