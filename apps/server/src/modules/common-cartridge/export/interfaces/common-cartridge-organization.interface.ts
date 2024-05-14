import { XmlObject } from './xml-object.interface';

export interface CommonCartridgeOrganization {
	isResource(): boolean;

	getManifestOrganizationXmlObject(): XmlObject;

	getManifestResourceXmlObject(): XmlObject;
}
