import { CommonCartridgeElement } from '../interfaces/common-cartridge-element.interface';

export class CommonCartridgeResourcesWrapperElement implements CommonCartridgeElement {
	constructor(private readonly items: CommonCartridgeElement[]) {}

	getManifestXmlObject(): Record<string, unknown> {
		return {
			resources: [
				{
					resource: this.items.map((items) => items.getManifestXmlObject()),
				},
			],
		};
	}
}
