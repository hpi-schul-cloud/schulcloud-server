import { CommonCartridgeResourceType, CommonCartridgeVersion } from '../../common-cartridge.enums';
import { CommonCartridgeResource } from '../../interfaces/common-cartridge-resource.interface';
import { buildXmlString } from '../../utils';

export type CommonCartridgeLtiResourcePropsV130 = {
	type: CommonCartridgeResourceType.LTI;
	version: CommonCartridgeVersion.V_1_3_0;
	identifier: string;
	folder: string;
	title: string;
	description: string;
	url: string;
};

export class CommonCartridgeLtiResourceV130 extends CommonCartridgeResource {
	public constructor(private readonly props: CommonCartridgeLtiResourcePropsV130) {
		super(props);
	}

	public override canInline(): boolean {
		return false;
	}

	public override getFilePath(): string {
		return `${this.props.folder}/${this.props.identifier}.xml`;
	}

	public override getFileContent(): string {
		return buildXmlString({
			cartridge_basiclti_link: {
				$: {
					xmlns: 'http://www.imsglobal.org/xsd/imslticc_v1p3',
					'xmlns:blti': 'http://www.imsglobal.org/xsd/imsbasiclti_v1p0',
					'xmlns:lticm': 'http://www.imsglobal.org/xsd/imslticm_v1p0',
					'xmlns:lticp': 'http://www.imsglobal.org/xsd/imslticp_v1p0',
					'xsi:schemaLocation':
						'http://www.imsglobal.org/xsd/imslticc_v1p3 http://www.imsglobal.org/xsd/imslticc_v1p3.xsd' +
						'http://www.imsglobal.org/xsd/imslticp_v1p0 imslticp_v1p0.xsd' +
						'http://www.imsglobal.org/xsd/imslticm_v1p0 imslticm_v1p0.xsd' +
						'http://www.imsglobal.org/xsd/imsbasiclti_v1p0 imsbasiclti_v1p0p1.xsd"',
				},
				blti: {
					title: this.props.title,
					description: this.props.description,
					launch_url: this.props.url,
					secure_launch_url: this.props.url,
					cartridge_bundle: {
						$: {
							identifierref: 'BLTI001_Bundle', // FIXME: is this correct?
						},
					},
					cartridge_icon: {
						$: {
							identifierref: 'BLTI001_Icon', // FIXME: is this correct?
						},
					},
				},
			},
		});
	}

	public override getSupportedVersion(): CommonCartridgeVersion {
		return CommonCartridgeVersion.V_1_3_0;
	}

	public override getManifestXmlObject(): Record<string, unknown> {
		return {
			$: {
				identifier: this.props.identifier,
				type: this.props.type, // FIXME: is this correct?
			},
			file: {
				$: {
					href: this.getFilePath(),
				},
			},
		};
	}
}
