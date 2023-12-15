import { CommonCartridgeVersion } from '../../../common-cartridge/common-cartridge.enums';
import { CommonCartridgeElement } from '../../../common-cartridge/interfaces/common-cartridge-element.interface';
import { CommonCartridgeResource } from '../../../common-cartridge/interfaces/common-cartridge-resource.interface';
import { createVersionNotSupportedError } from '../../../common-cartridge/utils';
import { CommonCartridgeOrganizationsWrapperElement } from '../elements/common-cartridge-organizations-wrapper-element';
import { CommonCartridgeResourcesWrapperElement } from '../elements/common-cartridge-resources-wrapper-element';

export type CommonCartridgeManifestElementProps = {
	version: CommonCartridgeVersion;
	identifier: string;
	metadata: CommonCartridgeElement;
	organizations: CommonCartridgeElement[];
	resources: CommonCartridgeElement[];
};

export class CommonCartridgeManifestResource implements CommonCartridgeResource {
	constructor(private readonly props: CommonCartridgeManifestElementProps) {}

	public canInline(): boolean {
		return false;
	}

	public getFilePath(): string {
		return 'imsmanifest.xml';
	}

	public getFileContent(): string {
		return this.xmlBuilder.buildObject(this.getManifestXmlObject());
	}

	public getManifestXmlObject(): Record<string, unknown> {
		return {
			manifest: {
				$: this.getXmlNamespacesByVersion(),
				metadata: this.props.metadata.getManifestXmlObject(),
				organizations: new CommonCartridgeOrganizationsWrapperElement(
					this.props.organizations
				).getManifestXmlObject(),
				resources: new CommonCartridgeResourcesWrapperElement(this.props.resources).getManifestXmlObject(),
			},
		};
	}

	private getXmlNamespacesByVersion(): Record<string, string> {
		switch (this.props.version) {
			case CommonCartridgeVersion.V_1_1_0:
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
			case CommonCartridgeVersion.V_1_3_0:
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
			default:
				throw createVersionNotSupportedError(this.props.version);
		}
	}
}
