import { CommonCartridgeResourceType, CommonCartridgeVersion } from '../common-cartridge.enums';
import { CommonCartridgeResource } from '../interfaces/common-cartridge-resource.interface';
import { buildXmlString, createVersionNotSupportedError } from '../utils';

export type CommonCartridgeLtiResourceProps = {
	type: CommonCartridgeResourceType.LTI;
	version: CommonCartridgeVersion;
	identifier: string;
	folder: string;
	title: string;
	description?: string;
	url: string;
};

export class CommonCartridgeLtiResource implements CommonCartridgeResource {
	constructor(private readonly props: CommonCartridgeLtiResourceProps) {}

	canInline(): boolean {
		return false;
	}

	getFilePath(): string {
		return `${this.props.folder}/${this.props.identifier}.xml`;
	}

	getFileContent(): string {
		return buildXmlString({
			cartridge_basiclti_link: {
				$: this.getXmlNamespacesByVersion(),
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
	}

	getManifestXmlObject(): Record<string, unknown> {
		return {
			$: {
				identifier: this.props.identifier,
				type: this.props.type,
			},
			file: {
				$: {
					href: this.props.folder,
				},
			},
		};
	}

	private getXmlNamespacesByVersion(): Record<string, string> {
		switch (this.props.version) {
			case CommonCartridgeVersion.V_1_1_0:
				return {
					xmlns: '/xsd/imslticc_v1p0',
					'xmlns:blti': '/xsd/imsbasiclti_v1p0',
					'xmlns:lticm': '/xsd/imslticm_v1p0',
					'xmlns:lticp': '/xsd/imslticp_v1p0',
					'xsi:schemaLocation':
						'/xsd/imslticc_v1p0 /xsd/lti/ltiv1p0/imslticc_v1p0.xsd' +
						'/xsd/imsbasiclti_v1p0 /xsd/lti/ltiv1p0/imsbasiclti_v1p0.xsd' +
						'/xsd/imslticm_v1p0 /xsd/lti/ltiv1p0/imslticm_v1p0.xsd' +
						'/xsd/imslticp_v1p0 /xsd/lti/ltiv1p0/imslticp_v1p0.xsd"',
				};
			case CommonCartridgeVersion.V_1_3_0:
				return {
					xmlns: 'http://www.imsglobal.org/xsd/imslticc_v1p3',
					'xmlns:blti': 'http://www.imsglobal.org/xsd/imsbasiclti_v1p0',
					'xmlns:lticm': 'http://www.imsglobal.org/xsd/imslticm_v1p0',
					'xmlns:lticp': 'http://www.imsglobal.org/xsd/imslticp_v1p0',
					'xsi:schemaLocation':
						'http://www.imsglobal.org/xsd/imslticc_v1p3 http://www.imsglobal.org/xsd/imslticc_v1p3.xsd' +
						'http://www.imsglobal.org/xsd/imslticp_v1p0 imslticp_v1p0.xsd' +
						'http://www.imsglobal.org/xsd/imslticm_v1p0 imslticm_v1p0.xsd' +
						'http://www.imsglobal.org/xsd/imsbasiclti_v1p0 imsbasiclti_v1p0p1.xsd"',
				};
			default:
				throw createVersionNotSupportedError(this.props.version);
		}
	}
}
