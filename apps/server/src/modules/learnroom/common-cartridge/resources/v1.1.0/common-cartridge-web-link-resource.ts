import { CommonCartridgeResourceType, CommonCartridgeVersion } from '../../common-cartridge.enums';
import { CommonCartridgeResource } from '../../interfaces/common-cartridge-resource.interface';
import { buildXmlString } from '../../utils';

export type CommonCartridgeWebLinkResourceProps = {
	type: CommonCartridgeResourceType.WEB_LINK;
	version: CommonCartridgeVersion.V_1_1_0;
	identifier: string;
	folder: string;
	title: string;
	url: string;
};

export class CommonCartridgeWebLinkResource extends CommonCartridgeResource {
	constructor(private readonly props: CommonCartridgeWebLinkResourceProps) {
		super(props);
	}

	public canInline(): boolean {
		return false;
	}

	public getFilePath(): string {
		return `${this.props.folder}/${this.props.identifier}.xml`;
	}

	public getFileContent(): string {
		return buildXmlString({
			webLink: {
				$: {
					xmlns: 'http://www.imsglobal.org/xsd/imsccv1p1/imswl_v1p1',
					'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
					'xsi:schemaLocation':
						'http://www.imsglobal.org/xsd/imsccv1p1/imswl_v1p1 https://www.imsglobal.org/sites/default/files/profile/cc/ccv1p1/ccv1p1_imswl_v1p1.xsd',
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

	public getSupportedVersion(): CommonCartridgeVersion {
		return CommonCartridgeVersion.V_1_1_0;
	}

	public getManifestXmlObject(): Record<string, unknown> {
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
