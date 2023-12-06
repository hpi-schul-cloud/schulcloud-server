import { CommonCartridgeElement } from './common-cartridge-element.interface';

/**
 * Every resource which should be added to the Common Cartridge archive must implement this interface.
 */
export abstract class CommonCartridgeResource extends CommonCartridgeElement {
	/**
	 * In later Common Cartridge versions, resources can be inlined in the imsmanifest.xml file.
	 * @returns true if the resource can be inlined, otherwise false.
	 */
	abstract canInline(): boolean;

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
