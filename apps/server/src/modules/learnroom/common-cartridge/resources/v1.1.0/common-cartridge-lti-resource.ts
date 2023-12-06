import { CommonCartridgeResourceType, CommonCartridgeVersion } from '../../common-cartridge.enums';
import { CommonCartridgeResource } from '../../interfaces/common-cartridge-resource.interface';
import { buildXmlString } from '../../utils';

export type CommonCartridgeLtiResourceProps = {
	type: CommonCartridgeResourceType.LTI;
	version: CommonCartridgeVersion;
	identifier: string;
	folder: string;
	title: string;
	description?: string;
	url: string;
};

export class CommonCartridgeLtiResource extends CommonCartridgeResource {
	public constructor(private readonly props: CommonCartridgeLtiResourceProps) {
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
					xmlns: '/xsd/imslticc_v1p0',
					'xmlns:blti': '/xsd/imsbasiclti_v1p0',
					'xmlns:lticm': '/xsd/imslticm_v1p0',
					'xmlns:lticp': '/xsd/imslticp_v1p0',
					'xsi:schemaLocation':
						'/xsd/imslticc_v1p0 /xsd/lti/ltiv1p0/imslticc_v1p0.xsd' +
						'/xsd/imsbasiclti_v1p0 /xsd/lti/ltiv1p0/imsbasiclti_v1p0.xsd' +
						'/xsd/imslticm_v1p0 /xsd/lti/ltiv1p0/imslticm_v1p0.xsd' +
						'/xsd/imslticp_v1p0 /xsd/lti/ltiv1p0/imslticp_v1p0.xsd"',
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
	}

	public override getSupportedVersion(): CommonCartridgeVersion {
		return CommonCartridgeVersion.V_1_1_0;
	}

	public override getManifestXmlObject(): Record<string, unknown> {
		return {
			$: {
				identifier: this.props.identifier,
				type: this.props.type,
			},
			file: {
				$: {
					href: this.getFilePath(),
				},
			},
		};
	}
}
