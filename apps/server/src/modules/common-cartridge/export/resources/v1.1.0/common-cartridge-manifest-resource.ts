import {
	CommonCartridgeElementType,
	CommonCartridgeResourceType,
	CommonCartridgeVersion,
} from '../../common-cartridge.enums';
import { CommonCartridgeElementFactory } from '../../elements/common-cartridge-element-factory';
import { CommonCartridgeBase, CommonCartridgeElement, CommonCartridgeResource, XmlObject } from '../../interfaces';
import { buildXmlString } from '../../utils';

export type CommonCartridgeManifestResourcePropsV110 = {
	type: CommonCartridgeResourceType.MANIFEST;
	version: CommonCartridgeVersion;
	identifier: string;
	metadata: CommonCartridgeElement;
	organizations: CommonCartridgeElement[];
	resources: CommonCartridgeElement[];
};

export class CommonCartridgeManifestResourceV110
	extends CommonCartridgeBase
	implements CommonCartridgeElement, CommonCartridgeResource
{
	constructor(private readonly props: CommonCartridgeManifestResourcePropsV110) {
		super(props);
	}

	public canInline(): boolean {
		return false;
	}

	public getFilePath(): string {
		return 'imsmanifest.xml';
	}

	public getFileContent(): string {
		return buildXmlString(this.getManifestXmlObject());
	}

	public getSupportedVersion(): CommonCartridgeVersion {
		return CommonCartridgeVersion.V_1_1_0;
	}

	public getManifestXmlObject(): XmlObject {
		return {
			manifest: {
				$: {
					identifier: this.props.identifier,
					xmlns: 'http://www.imsglobal.org/xsd/imsccv1p1/imscp_v1p1',
					'xmlns:mnf': 'http://ltsc.ieee.org/xsd/imsccv1p1/LOM/manifest',
					'xmlns:res': 'http://ltsc.ieee.org/xsd/imsccv1p1/LOM/resource',
					'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
					'xsi:schemaLocation':
						'http://www.imsglobal.org/xsd/imsccv1p1/imscp_v1p1 https://www.imsglobal.org/profile/cc/ccv1p1/ccv1p1_imscp_v1p2_v1p0.xsd ' +
						'http://ltsc.ieee.org/xsd/imsccv1p1/LOM/manifest https://www.imsglobal.org/profile/cc/ccv1p1/LOM/ccv1p1_lommanifest_v1p0.xsd ' +
						'http://ltsc.ieee.org/xsd/imsccv1p1/LOM/resource https://www.imsglobal.org/profile/cc/ccv1p1/LOM/ccv1p1_lomresource_v1p0.xsd',
				},
				metadata: this.props.metadata.getManifestXmlObject(),
				organizations: CommonCartridgeElementFactory.createElement({
					type: CommonCartridgeElementType.ORGANIZATIONS_WRAPPER,
					version: this.props.version,
					items: this.props.organizations,
				}).getManifestXmlObject(),
				...CommonCartridgeElementFactory.createElement({
					type: CommonCartridgeElementType.RESOURCES_WRAPPER,
					version: this.props.version,
					items: this.props.resources,
				}).getManifestXmlObject(),
			},
		};
	}
}
