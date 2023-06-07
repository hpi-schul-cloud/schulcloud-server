import { Builder } from 'xml2js';
import { ICommonCartridgeElement } from './common-cartridge-element.interface';
import { ICommonCartridgeFile } from './common-cartridge-file.interface';
import { CommonCartridgeResourceType, CommonCartridgeVersion } from './common-cartridge-enums';

export type ICommonCartridgeLtiResourceProps = {
	type: CommonCartridgeResourceType.LTI;
	version: CommonCartridgeVersion;
	identifier: string;
	href: string;
	title: string;
	description?: string;
	url: string;
};

export class CommonCartridgeLtiResource implements ICommonCartridgeElement, ICommonCartridgeFile {
	constructor(private readonly props: ICommonCartridgeLtiResourceProps, private readonly xmlBuilder: Builder) {}

	canInline(): boolean {
		return false;
	}

	content(): string {
		switch (this.props.version) {
			case CommonCartridgeVersion.V_1_3_0:
				return this.xmlBuilder.buildObject({
					cartridge_basiclti_link: {
						$: {
							xmlns: 'http://www.imsglobal.org/xsd/imslticc_v1p3',
							'xmlns:blti': 'http://www.imsglobal.org/xsd/imsbasiclti_v1p0',
							'xmlns:lticm': 'http://www.imsglobal.org/xsd/imslticm_v1p0',
							'xmlns:lticp': 'http://www.imsglobal.org/xsd/imslticp_v1p0',
							'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
							'xsi:schemaLocation':
								'http://www.imsglobal.org/xsd/imslticc_v1p3 http://www.imsglobal.org/xsd/imslticc_v1p3.xsd' +
								'http://www.imsglobal.org/xsd/imslticp_v1p0 imslticp_v1p0.xsd' +
								'http://www.imsglobal.org/xsd/imslticm_v1p0 imslticm_v1p0.xsd' +
								'http://www.imsglobal.org/xsd/imsbasiclti_v1p0 imsbasiclti_v1p0p1.xsd">',
						},
						blti: {
							title: this.props.title,
							description: this.props.description,
							launch_url: this.props.url,
							secure_launch_url: this.props.url,
							cartridge_bundle: {
								$: {
									identifierref: 'BLTI001_Bundle',
								},
							},
							cartridge_icon: {
								$: {
									identifierref: 'BLTI001_Icon',
								},
							},
						},
					},
				});
			default:
				return this.xmlBuilder.buildObject({
					cartridge_basiclti_link: {
						$: {
							xmlns: '/xsd/imslticc_v1p0',
							'xmlns:blti': '/xsd/imsbasiclti_v1p0',
							'xmlns:lticm': '/xsd/imslticm_v1p0',
							'xmlns:lticp': '/xsd/imslticp_v1p0',
							'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
							'xsi:schemaLocation':
								'/xsd/imslticc_v1p0 /xsd/lti/ltiv1p0/imslticc_v1p0.xsd' +
								'/xsd/imsbasiclti_v1p0 /xsd/lti/ltiv1p0/imsbasiclti_v1p0.xsd' +
								'/xsd/imslticm_v1p0 /xsd/lti/ltiv1p0/imslticm_v1p0.xsd' +
								'/xsd/imslticp_v1p0 /xsd/lti/ltiv1p0/imslticp_v1p0.xsd">',
						},
						blti: {
							title: this.props.title,
							description: this.props.description,
							launch_url: this.props.url,
							secure_launch_url: this.props.url,
							cartridge_bundle: {
								$: {
									identifierref: 'BLTI001_Bundle',
								},
							},
							cartridge_icon: {
								$: {
									identifierref: 'BLTI001_Icon',
								},
							},
							// this are optional properties
							// custom: {},
							// extensions: {},
							// icon: '',
							// secure_icon: '',
							// vendor: {},
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
