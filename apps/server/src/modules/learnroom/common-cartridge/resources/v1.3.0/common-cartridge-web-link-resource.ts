import { CommonCartridgeResourceType, CommonCartridgeVersion } from '../../common-cartridge.enums';
import { CommonCartridgeResource } from '../../interfaces/common-cartridge-resource.interface';
import { buildXmlString } from '../../utils';

export type CommonCartridgeWebLinkResourceProps = {
	type: CommonCartridgeResourceType.WEB_LINK;
	version: CommonCartridgeVersion.V_1_3_0;
	identifier: string;
	folder: string;
	title: string;
	url: string;
};

export class CommonCartridgeWebLinkResource extends CommonCartridgeResource {
	public constructor(private readonly props: CommonCartridgeWebLinkResourceProps) {
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
	}

	public override getSupportedVersion(): CommonCartridgeVersion {
		return CommonCartridgeVersion.V_1_3_0;
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
