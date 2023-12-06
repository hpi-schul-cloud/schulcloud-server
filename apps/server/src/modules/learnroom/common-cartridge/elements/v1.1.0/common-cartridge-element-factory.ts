import { CommonCartridgeElement } from '../../interfaces/common-cartridge-element.interface';

export class CommonCartridgeElementFactory {
	private static readonly instance = new CommonCartridgeElementFactory();

	public static getInstance(): CommonCartridgeElementFactory {
		return this.instance;
	}

	public createElement(_props: unknown): CommonCartridgeElement {
		throw new Error('Method not implemented.');
	}
}
