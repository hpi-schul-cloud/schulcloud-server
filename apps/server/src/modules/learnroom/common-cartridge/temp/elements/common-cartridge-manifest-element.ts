import { CommonCartridgeElement } from '../interfaces/common-cartridge-element.interface';

export class CommonCartridgeManifestElement implements CommonCartridgeElement {
	getManifestXmlObject(): Record<string, unknown> {
		throw new Error('Method not implemented.');
	}
}
