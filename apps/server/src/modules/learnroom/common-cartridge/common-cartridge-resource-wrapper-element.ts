import { ICommonCartridgeElement } from './common-cartridge-element.interface';
import { CommonCartridgeResourceItemElement } from './common-cartridge-resource-item-element';

export class CommonCartridgeResourceWrapperElement implements ICommonCartridgeElement {
	constructor(private readonly resourceElements: CommonCartridgeResourceItemElement[]) {}

	transform(): Record<string, unknown> {
		return {
			resource: this.resourceElements.map((resourceElement) => {
				return resourceElement.transform();
			}),
		};
	}
}
