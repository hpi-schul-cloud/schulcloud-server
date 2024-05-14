import { XmlObject } from './xml-object.interface';

/**
 * Every element which should be listed in the Common Cartridge manifest must implement this interface.
 */
export interface CommonCartridgeElement {
	/**
	 * This method is used to build the imsmanifest.xml file.
	 * @returns The XML object representation for the imsmanifest.xml file.
	 */
	getManifestXmlObject(): XmlObject;
}
