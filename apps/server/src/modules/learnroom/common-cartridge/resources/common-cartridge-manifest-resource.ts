import { Builder } from 'xml2js';
import { CommonCartridgeVersion } from '../common-cartridge.enums';
import { CommonCartridgeElement } from '../interfaces/common-cartridge-element.interface';
import { CommonCartridgeResource } from '../interfaces/common-cartridge-resource.interface';
import { CommonCartridgeOrganizationsWrapperElement } from '../elements/common-cartridge-organizations-wrapper-element';
import { CommonCartridgeResourcesWrapperElement } from '../elements/common-cartridge-resources-wrapper-element';
import { createVersionNotSupportedError } from '../utils';

type CommonCartridgeManifestElementProps = {
	version: CommonCartridgeVersion;
	identifier: string;
	metadata: CommonCartridgeElement;
	organizations: CommonCartridgeElement[];
	resources: CommonCartridgeElement[];
};

export class CommonCartridgeManifestResource implements CommonCartridgeResource {
	private readonly xmlBuilder = new Builder();

	constructor(private readonly props: CommonCartridgeManifestElementProps) {}

	canInline(): boolean {
		return false;
	}

	getFilePath(): string {
		return 'imsmanifest.xml';
	}

	getFileContent(): string {
		return this.xmlBuilder.buildObject(this.getManifestXml());
	}

	getManifestXml(): Record<string, unknown> {
		return {
			manifest: {
				$: this.getXmlNamespacesByVersion(),
				metadata: this.props.metadata.getManifestXml(),
				organizations: new CommonCartridgeOrganizationsWrapperElement(
					this.props.organizations
				).getManifestXml(),
				resources: new CommonCartridgeResourcesWrapperElement(this.props.resources).getManifestXml(),
			},
		};
	}

	private getXmlNamespacesByVersion(): Record<string, string> {
		switch (this.props.version) {
			case CommonCartridgeVersion.V_1_1:
				return {
					identifier: this.props.identifier,
					xmlns: 'http://www.imsglobal.org/xsd/imsccv1p3/imscp_v1p1',
					'xmlns:mnf': 'http://ltsc.ieee.org/xsd/imsccv1p3/LOM/manifest',
					'xmlns:res': 'http://ltsc.ieee.org/xsd/imsccv1p3/LOM/resource',
					'xmlns:ext': 'http://www.imsglobal.org/xsd/imsccv1p3/imscp_extensionv1p2',
					'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
					'xsi:schemaLocation':
						'http://ltsc.ieee.org/xsd/imsccv1p3/LOM/resource http://www.imsglobal.org/profile/cc/ccv1p3/LOM/ccv1p3_lomresource_v1p0.xsd ' +
						'http://www.imsglobal.org/xsd/imsccv1p3/imscp_v1p1 http://www.imsglobal.org/profile/cc/ccv1p3/ccv1p3_imscp_v1p2_v1p0.xsd ' +
						'http://ltsc.ieee.org/xsd/imsccv1p3/LOM/manifest http://www.imsglobal.org/profile/cc/ccv1p3/LOM/ccv1p3_lommanifest_v1p0.xsd ' +
						'http://www.imsglobal.org/xsd/imsccv1p3/imscp_extensionv1p2 http://www.imsglobal.org/profile/cc/ccv1p3/ccv1p3_cpextensionv1p2_v1p0.xsd',
				};
			case CommonCartridgeVersion.V_1_3:
				return {
					identifier: this.props.identifier,
					xmlns: 'http://www.imsglobal.org/xsd/imsccv1p1/imscp_v1p1',
					'xmlns:mnf': 'http://ltsc.ieee.org/xsd/imsccv1p1/LOM/manifest',
					'xmlns:res': 'http://ltsc.ieee.org/xsd/imsccv1p1/LOM/resource',
					'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
					'xsi:schemaLocation':
						'http://ltsc.ieee.org/xsd/imsccv1p1/LOM/resource http://www.imsglobal.org/profile/cc/ccv1p1/LOM/ccv1p1_lomresource_v1p0.xsd ' +
						'http://www.imsglobal.org/xsd/imsccv1p1/imscp_v1p1 http://www.imsglobal.org/profile/cc/ccv1p1/ccv1p1_imscp_v1p2_v1p0.xsd ' +
						'http://ltsc.ieee.org/xsd/imsccv1p1/LOM/manifest http://www.imsglobal.org/profile/cc/ccv1p1/LOM/ccv1p1_lommanifest_v1p0.xsd ',
				};
			default:
				throw createVersionNotSupportedError(this.props.version);
		}
	}
}
