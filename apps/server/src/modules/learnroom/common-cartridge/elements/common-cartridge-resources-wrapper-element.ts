import { CommonCartridgeElement } from '../interfaces/common-cartridge-element.interface';

export class CommonCartridgeResourcesWrapperElement implements CommonCartridgeElement {
	constructor(private readonly items: CommonCartridgeElement[]) {}

	getManifestXml(): Record<string, unknown> {
		return {
			resources: [
				{
					resource: this.items.map((items) => items.getManifestXml()),
				},
			],
		};
	}
}
