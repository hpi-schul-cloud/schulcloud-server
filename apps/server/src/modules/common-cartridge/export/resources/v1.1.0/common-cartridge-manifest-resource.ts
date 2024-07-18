import {
	CommonCartridgeElementType,
	CommonCartridgeResourceType,
	CommonCartridgeVersion,
} from '../../common-cartridge.enums';
import { CommonCartridgeElementFactory } from '../../elements/common-cartridge-element-factory';
import { ElementTypeNotSupportedLoggableException } from '../../errors';
import { CommonCartridgeElement, CommonCartridgeResource, XmlObject } from '../../interfaces';
import { buildXmlString } from '../../utils';

export type CommonCartridgeManifestResourcePropsV110 = {
	type: CommonCartridgeResourceType.MANIFEST;
	version: CommonCartridgeVersion;
	identifier: string;
	metadata: CommonCartridgeElement;
	organizations: CommonCartridgeElement[];
	resources: CommonCartridgeElement[];
};

export class CommonCartridgeManifestResourceV110 extends CommonCartridgeResource {
	constructor(private readonly props: CommonCartridgeManifestResourcePropsV110) {
		super(props);
	}

	public getSupportedVersion(): CommonCartridgeVersion {
		return CommonCartridgeVersion.V_1_1_0;
	}

	public getManifestXmlObject(elementType: CommonCartridgeElementType): XmlObject {
		switch (elementType) {
			case CommonCartridgeElementType.MANIFEST:
				return this.getManifestXmlObjectInternal();
			default:
				throw new ElementTypeNotSupportedLoggableException(elementType);
		}
	}

	public getFilePath(): string {
		return 'imsmanifest.xml';
	}

	public getFileContent(): string {
		return buildXmlString(this.getManifestXmlObjectInternal());
	}

	private getManifestXmlObjectInternal(): XmlObject {
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
				metadata: this.props.metadata.getManifestXmlObject(CommonCartridgeElementType.METADATA),
				organizations: CommonCartridgeElementFactory.createElement({
					type: CommonCartridgeElementType.ORGANIZATIONS_WRAPPER,
					version: this.props.version,
					items: this.props.organizations,
				}).getManifestXmlObject(CommonCartridgeElementType.ORGANIZATIONS_WRAPPER),
				...CommonCartridgeElementFactory.createElement({
					type: CommonCartridgeElementType.RESOURCES_WRAPPER,
					version: this.props.version,
					items: this.props.resources,
				}).getManifestXmlObject(CommonCartridgeElementType.RESOURCES_WRAPPER),
			},
		};
	}
}
