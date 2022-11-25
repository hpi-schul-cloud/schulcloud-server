import { ICommonCartridgeElement } from './common-cartridge-element.interface';

export class CommonCartridgeResourceWrapperElement implements ICommonCartridgeElement {
	constructor(private readonly resourceElements: ICommonCartridgeElement[]) {}

	transform(): Record<string, unknown> {
		return {
			resource: this.resourceElements.map((resourceElement) => {
				return resourceElement.transform();
			}),
		};
	}
}
