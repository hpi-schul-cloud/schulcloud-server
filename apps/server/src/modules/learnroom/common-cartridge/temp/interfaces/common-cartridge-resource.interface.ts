import AdmZip from 'adm-zip';

/**
 * Every resource which should be added to the Common Cartridge archive must implement this interface.
 */
export interface CommonCartridgeResource {
	/**
	 * In later Common Cartridge versions, resources can be inlined in the imsmanifest.xml file.
	 * @returns true if the resource can be inlined, otherwise false.
	 */
	canInline(): boolean;

	/**
	 * Adds the resource to the Common Cartridge archive.
	 * @param archive The archive to which the resource should be added.
	 */
	addToArchive(archive: AdmZip): void;

	/**
	 * This method is used to build the imsmanifest.xml file.
	 * @returns The XML representation of the resource if the resource can be inlined otherwise undefined.
	 */
	getManifestXml(): Record<string, unknown> | undefined;
}
