import { Builder } from 'xml2js';
import {
	CommonCartridgeElementType,
	CommonCartridgeResourceType,
	CommonCartridgeVersion,
} from '../../common-cartridge.enums';
import { CommonCartridgeOrganizationsWrapperElementV110 } from '../../elements/v1.1.0/common-cartridge-organizations-wrapper-element';
import { CommonCartridgeResourcesWrapperElementV110 } from '../../elements/v1.1.0/common-cartridge-resources-wrapper-element';
import { CommonCartridgeElement } from '../../interfaces/common-cartridge-element.interface';
import { CommonCartridgeResource } from '../../interfaces/common-cartridge-resource.interface';

export type CommonCartridgeManifestResourcePropsV110 = {
	type: CommonCartridgeResourceType.MANIFEST;
	version: CommonCartridgeVersion.V_1_1_0;
	identifier: string;
	metadata: CommonCartridgeElement;
	organizations: CommonCartridgeElement[];
	resources: CommonCartridgeElement[];
};

export class CommonCartridgeManifestResourceV110 extends CommonCartridgeResource {
	private readonly xmlBuilder = new Builder();

	public constructor(private readonly props: CommonCartridgeManifestResourcePropsV110) {
		super(props);
	}

	public override canInline(): boolean {
		return false;
	}

	public override getFilePath(): string {
		return 'imsmanifest.xml';
	}

	public override getFileContent(): string {
		return this.xmlBuilder.buildObject(this.getManifestXmlObject());
	}

	public override getSupportedVersion(): CommonCartridgeVersion {
		return CommonCartridgeVersion.V_1_1_0;
	}

	public override getManifestXmlObject(): Record<string, unknown> {
		return {
			manifest: {
				$: {
					identifier: this.props.identifier,
					xmlns: 'http://www.imsglobal.org/xsd/imsccv1p1/imscp_v1p1',
					'xmlns:mnf': 'http://ltsc.ieee.org/xsd/imsccv1p1/LOM/manifest',
					'xmlns:res': 'http://ltsc.ieee.org/xsd/imsccv1p1/LOM/resource',
					'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
					'xsi:schemaLocation':
						'http://ltsc.ieee.org/xsd/imsccv1p1/LOM/resource http://www.imsglobal.org/profile/cc/ccv1p1/LOM/ccv1p1_lomresource_v1p0.xsd ' +
						'http://www.imsglobal.org/xsd/imsccv1p1/imscp_v1p1 http://www.imsglobal.org/profile/cc/ccv1p1/ccv1p1_imscp_v1p2_v1p0.xsd ' +
						'http://ltsc.ieee.org/xsd/imsccv1p1/LOM/manifest http://www.imsglobal.org/profile/cc/ccv1p1/LOM/ccv1p1_lommanifest_v1p0.xsd ',
				},
				metadata: this.props.metadata.getManifestXmlObject(),
				organizations: new CommonCartridgeOrganizationsWrapperElementV110({
					type: CommonCartridgeElementType.ORGANIZATIONS_WRAPPER,
					version: this.props.version,
					items: this.props.organizations,
				}).getManifestXmlObject(),
				resources: new CommonCartridgeResourcesWrapperElementV110({
					type: CommonCartridgeElementType.RESOURCES_WRAPPER,
					version: this.props.version,
					items: this.props.resources,
				}).getManifestXmlObject(),
			},
		};
	}
}
