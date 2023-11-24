/**
 * Every element which should be listed in the Common Cartridge manifest must implement this interface.
 */
export interface CommonCartridgeElement {
	/**
	 * Returns the XML representation of the element.
	 * This method is used to build the imsmanifest.xml file.
	 */
	getManifestXmlObject(): Record<string, unknown>;
}
