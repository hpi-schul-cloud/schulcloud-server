import { Readable } from 'node:stream';
import { CommonCartridgeElement } from './common-cartridge-element.interface';

export type ResourceFileContentType = string | Buffer | Readable;

export type ResourceFileContent = {
	path: string;
	content: ResourceFileContentType;
};

/**
 * Every resource which should be added to the Common Cartridge archive must implement this interface.
 */
export abstract class CommonCartridgeResource extends CommonCartridgeElement {
	/**
	 * This method is used to get the content of the resource including file path and content.
	 * @returns The content of the resource.
	 */
	public abstract getFileContent(): ResourceFileContent | ResourceFileContent[];
}
