import { Builder } from 'xml2js';
import { ICommonCartridgeElement } from './common-cartridge-element.interface';
import { ICommonCartridgeFile } from './common-cartridge-file.interface';
import { CommonCartridgeResourceType, CommonCartridgeVersion } from './common-cartridge-enums';

export type ICommonCartridgeWebLinkResourceProps = {
	type: CommonCartridgeResourceType.WEB_LINK_V1 | CommonCartridgeResourceType.WEB_LINK_V3;
	version: CommonCartridgeVersion;
	identifier: string;
	href: string;
	title: string;
	url: string;
};

export class CommonCartridgeWebLinkResourceElement implements ICommonCartridgeElement, ICommonCartridgeFile {
	constructor(private readonly props: ICommonCartridgeWebLinkResourceProps, private readonly xmlBuilder: Builder) {}

	canInline(): boolean {
		return false;
	}

	content(): string {
		switch (this.props.version) {
			case CommonCartridgeVersion.V_1_3_0:
				return this.xmlBuilder.buildObject({
					webLink: {
						$: {
							xmlns: 'http://www.imsglobal.org/xsd/imsccv1p3/imswl_v1p3',
							'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
							'xsi:schemaLocation':
								'http://www.imsglobal.org/xsd/imsccv1p3/imswl_v1p3 http://www.imsglobal.org/profile/cc/ccv1p3/ccv1p3_imswl_v1p3.xsd',
						},
						title: this.props.title,
						url: {
							$: {
								href: this.props.url,
								target: '_self',
								windowFeatures: 'width=100, height=100',
							},
						},
					},
				});
			default:
				return this.xmlBuilder.buildObject({
					webLink: {
						$: {
							xmlns: '/xsd/imsccv1p1/imswl_v1p1',
							'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
							'xsi:schemaLocation': '/xsd/imsccv1p1/imswl_v1p1 /profile/cc/ccv1p1/ccv1p1_imswl_v1p1.xsd',
						},
						title: this.props.title,
						url: {
							$: {
								href: this.props.url,
								target: '_self',
								windowFeatures: 'width=100, height=100',
							},
						},
					},
				});
		}
	}

	transform(): Record<string, unknown> {
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
