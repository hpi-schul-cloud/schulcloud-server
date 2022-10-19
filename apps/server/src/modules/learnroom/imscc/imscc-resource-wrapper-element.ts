import { IImsccElement } from './imscc-element.interface';
import { ImsccResourceItemElement } from './imscc-resource-item-element';

export class ImsccResourceWrapperElement implements IImsccElement {
	constructor(private readonly resourceElements: ImsccResourceItemElement[]) {}

	transform(): Record<string, unknown> {
		return {
			resource: this.resourceElements.map((resourceElement) => {
				return resourceElement.transform();
			}),
		};
	}
}
