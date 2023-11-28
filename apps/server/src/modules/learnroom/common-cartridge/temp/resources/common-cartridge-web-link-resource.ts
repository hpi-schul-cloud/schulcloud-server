import { Builder } from 'xml2js';
import { CommonCartridgeResourceType, CommonCartridgeVersion } from '../common-cartridge.enums';
import { CommonCartridgeResource } from '../interfaces/common-cartridge-resource.interface';

export type ICommonCartridgeWebLinkResourceProps = {
	type: CommonCartridgeResourceType.WEB_LINK_V_1_1 | CommonCartridgeResourceType.WEB_LINK_V_1_3;
	version: CommonCartridgeVersion;
	identifier: string;
	href: string;
	title: string;
	url: string;
};

export class CommonCartridgeWebLinkResourceElement implements CommonCartridgeResource {
	constructor(private readonly props: ICommonCartridgeWebLinkResourceProps, private readonly xmlBuilder: Builder) {}

	canInline(): boolean {
		return false;
	}

	// TODO: This is not correct. The href should be relative to the imsmanifest.xml file.
	getFilePath(): string {
		return this.props.href;
	}

	getFileContent(): string {
		const commonTags = {
			title: this.props.title,
			url: {
				$: {
					href: this.props.url,
					target: '_self',
					windowFeatures: 'width=100, height=100',
				},
			},
		};
		switch (this.props.version) {
			case CommonCartridgeVersion.V_1_3:
				return this.xmlBuilder.buildObject({
					webLink: {
						...commonTags,
						$: {
							xmlns: 'http://www.imsglobal.org/xsd/imsccv1p3/imswl_v1p3',
							'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
							'xsi:schemaLocation':
								'http://www.imsglobal.org/xsd/imsccv1p3/imswl_v1p3 http://www.imsglobal.org/profile/cc/ccv1p3/ccv1p3_imswl_v1p3.xsd',
						},
					},
				});
			default:
				return this.xmlBuilder.buildObject({
					webLink: {
						...commonTags,
						$: {
							xmlns: 'http://www.imsglobal.org/xsd/imsccv1p1/imswl_v1p1',
							'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
							'xsi:schemaLocation':
								'http://www.imsglobal.org/xsd/imsccv1p1/imswl_v1p1 https://www.imsglobal.org/sites/default/files/profile/cc/ccv1p1/ccv1p1_imswl_v1p1.xsd',
						},
					},
				});
		}
	}

	getManifestXml(): Record<string, unknown> {
		return {
			$: {
				identifier: this.props.identifier,
				type: this.props.type,
			},
			file: {
				$: {
					href: this.props.href,
				},
			},
		};
	}
}
