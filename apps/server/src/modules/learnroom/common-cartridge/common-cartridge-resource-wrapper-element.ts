import { CommonCartridgeElement } from './common-cartridge-element.interface';

export class CommonCartridgeResourceWrapperElement implements CommonCartridgeElement {
	constructor(private readonly resourceElements: CommonCartridgeElement[]) {}

	transform(): Record<string, unknown> {
		return {
			resource: this.resourceElements.map((resourceElement) => resourceElement.transform()),
		};
	}
}
