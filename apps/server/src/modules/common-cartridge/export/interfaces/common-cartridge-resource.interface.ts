import { CommonCartridgeElement } from './common-cartridge-element.interface';

/**
 * Every resource which should be added to the Common Cartridge archive must implement this interface.
 */
export abstract class CommonCartridgeResource extends CommonCartridgeElement {
	/**
	 * This method is used to determine the path of the resource in the Common Cartridge archive.
	 * @returns The path of the resource in the Common Cartridge archive.
	 */
	abstract getFilePath(): string;

	/**
	 * This method is used to get the content of the resource.
	 * @returns The content of the resource.
	 */
	abstract getFileContent(): string;
}
