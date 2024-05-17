import {
	CommonCartridgeElementType,
	CommonCartridgeResourceType,
	CommonCartridgeVersion,
} from '../../common-cartridge.enums';
import {
	CommonCartridgeOrganizationsWrapperElementV130,
	CommonCartridgeResourcesWrapperElementV130,
} from '../../elements/v1.3.0';
import { ElementTypeNotSupportedLoggableException } from '../../errors';
import { CommonCartridgeElement, CommonCartridgeResource, XmlObject } from '../../interfaces';
import { buildXmlString } from '../../utils';

export type CommonCartridgeManifestResourcePropsV130 = {
	type: CommonCartridgeResourceType.MANIFEST;
	version: CommonCartridgeVersion;
	identifier: string;
	metadata: CommonCartridgeElement;
	organizations: CommonCartridgeElement[];
	resources: CommonCartridgeElement[];
};

export class CommonCartridgeManifestResourceV130 extends CommonCartridgeResource {
	constructor(private readonly props: CommonCartridgeManifestResourcePropsV130) {
		super(props);
	}

	public getFilePath(): string {
		return 'imsmanifest.xml';
	}

	public getFileContent(): string {
		return buildXmlString(this.getManifestXmlObject(CommonCartridgeElementType.MANIFEST));
	}

	public getSupportedVersion(): CommonCartridgeVersion {
		return CommonCartridgeVersion.V_1_3_0;
	}

	public getManifestXmlObject(elementType: CommonCartridgeElementType): XmlObject {
		switch (elementType) {
			case CommonCartridgeElementType.MANIFEST:
				return this.getManifestXmlObjectInternal();
			default:
				throw new ElementTypeNotSupportedLoggableException(elementType);
		}
	}

	public getManifestXmlObjectInternal(): XmlObject {
		return {
			manifest: {
				$: {
					identifier: this.props.identifier,
					xmlns: 'http://www.imsglobal.org/xsd/imsccv1p3/imscp_v1p1',
					'xmlns:mnf': 'http://ltsc.ieee.org/xsd/imsccv1p3/LOM/manifest',
					'xmlns:res': 'http://ltsc.ieee.org/xsd/imsccv1p3/LOM/resource',
					'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
					'xsi:schemaLocation':
						'http://www.imsglobal.org/xsd/imsccv1p3/imscp_v1p1 https://www.imsglobal.org/profile/cc/ccv1p3/ccv1p3_imscp_v1p2_v1p0.xsd ' +
						'http://ltsc.ieee.org/xsd/imsccv1p3/LOM/manifest https://www.imsglobal.org/profile/cc/ccv1p3/LOM/ccv1p3_lommanifest_v1p0.xsd ' +
						'http://ltsc.ieee.org/xsd/imsccv1p3/LOM/resource https://www.imsglobal.org/profile/cc/ccv1p3/LOM/ccv1p3_lomresource_v1p0.xsd',
				},
				metadata: this.props.metadata.getManifestXmlObject(CommonCartridgeElementType.METADATA),
				organizations: new CommonCartridgeOrganizationsWrapperElementV130({
					type: CommonCartridgeElementType.ORGANIZATIONS_WRAPPER,
					version: this.props.version,
					items: this.props.organizations,
				}).getManifestXmlObject(CommonCartridgeElementType.ORGANIZATIONS_WRAPPER),
				...new CommonCartridgeResourcesWrapperElementV130({
					type: CommonCartridgeElementType.RESOURCES_WRAPPER,
					version: this.props.version,
					items: this.props.resources,
				}).getManifestXmlObject(CommonCartridgeElementType.RESOURCES_WRAPPER),
			},
		};
	}
}
