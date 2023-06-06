import { ICommonCartridgeElement } from './common-cartridge-element.interface';
import { CommonCartridgeMetadataElement, ICommonCartridgeMetadataProps } from './common-cartridge-metadata-element';
import { CommonCartridgeOrganizationWrapperElement } from './common-cartridge-organization-wrapper-element';
import { CommonCartridgeResourceWrapperElement } from './common-cartridge-resource-wrapper-element';
import { CommonCartridgeVersion } from './common-cartridge-enums';

export type ICommonCartridgeManifestProps = {
	identifier: string;
};

export class CommonCartridgeManifestElement implements ICommonCartridgeElement {
	constructor(
		private readonly props: ICommonCartridgeManifestProps,
		private readonly metadataProps: ICommonCartridgeMetadataProps,
		private readonly organizations: ICommonCartridgeElement[],
		private readonly resources: ICommonCartridgeElement[]
	) {}

	transform(): Record<string, unknown> {
		const versionNumber = this.metadataProps.version;
		switch (versionNumber) {
			case CommonCartridgeVersion.V_1_3_0:
				return {
					manifest: {
						$: {
							identifier: this.props.identifier,
							xmlns: 'http://www.imsglobal.org/xsd/imsccv1p3/imswl_v1p3',
							'xmlns:mnf': 'http://ltsc.ieee.org/xsd/imsccv1p3/LOM/manifest',
							'xmlns:res': 'http://ltsc.ieee.org/xsd/imsccv1p3/LOM/resource',
							'xmlns:ext': 'http://www.imsglobal.org/xsd/imsccv1p3/imscp_extensionv1p2',
							'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
							'xsi:schemaLocation':
								'http://ltsc.ieee.org/xsd/imsccv1p3/LOM/resource http://www.imsglobal.org/profile/cc/ccv1p3/LOM/ccv1p3_lomresource_v1p0.xsd ' +
								'http://www.imsglobal.org/xsd/imsccv1p3/imscp_v1p1 http://www.imsglobal.org/profile/cc/ccv1p3/ccv1p3_imscp_v1p2_v1p0.xsd ' +
								'http://ltsc.ieee.org/xsd/imsccv1p3/LOM/manifest http://www.imsglobal.org/profile/cc/ccv1p3/LOM/ccv1p3_lommanifest_v1p0.xsd ' +
								'http://www.imsglobal.org/xsd/imsccv1p3/imscp_extensionv1p2 http://www.imsglobal.org/profile/cc/ccv1p3/ccv1p3_cpextensionv1p2_v1p0.xsd',
						},
						metadata: new CommonCartridgeMetadataElement(this.metadataProps).transform(),
						organizations: new CommonCartridgeOrganizationWrapperElement(this.organizations).transform(),
						resources: new CommonCartridgeResourceWrapperElement(this.resources).transform(),
					},
				};
			default:
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
						metadata: new CommonCartridgeMetadataElement(this.metadataProps).transform(),
						organizations: new CommonCartridgeOrganizationWrapperElement(this.organizations).transform(),
						resources: new CommonCartridgeResourceWrapperElement(this.resources).transform(),
					},
				};
		}
	}
}
