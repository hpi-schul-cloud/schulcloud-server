import { CommonCartridgeElementType } from '../common-cartridge.enums';
import { CommonCartridgeBase } from './common-cartridge-base.interface';
import { XmlObject } from './xml-object.interface';

/**
 * Every element which should be listed in the Common Cartridge manifest must implement this interface.
 */
export abstract class CommonCartridgeElement extends CommonCartridgeBase {
	/**
	 * This method is used to build the imsmanifest.xml file.
	 * @returns The XML object representation for the imsmanifest.xml file.
	 */
	abstract getManifestXmlObject(elementType: CommonCartridgeElementType): XmlObject;
}
