import { CommonCartridgeResourceType, CommonCartridgeVersion } from '../common-cartridge.enums';
import { CommonCartridgeResource } from '../interfaces/common-cartridge-resource.interface';
import { buildXmlString, createVersionNotSupportedError } from '../utils';

export type CommonCartridgeWebLinkResourceProps = {
	type: CommonCartridgeResourceType.WEB_LINK;
	version: CommonCartridgeVersion;
	identifier: string;
	folder: string;
	title: string;
	url: string;
};

export class CommonCartridgeWebLinkResource implements CommonCartridgeResource {
	constructor(private readonly props: CommonCartridgeWebLinkResourceProps) {}

	canInline(): boolean {
		return false;
	}

	getFilePath(): string {
		return `${this.props.folder}/${this.props.identifier}.xml`;
	}

	getFileContent(): string {
		return buildXmlString({
			webLink: {
				$: this.getXmlNamespacesByVersion(),
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

	getManifestXml(): Record<string, unknown> {
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
					xmlns: 'http://www.imsglobal.org/xsd/imsccv1p1/imswl_v1p1',
					'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
					'xsi:schemaLocation':
						'http://www.imsglobal.org/xsd/imsccv1p1/imswl_v1p1 https://www.imsglobal.org/sites/default/files/profile/cc/ccv1p1/ccv1p1_imswl_v1p1.xsd',
				};
			case CommonCartridgeVersion.V_1_3_0:
				return {
					xmlns: 'http://www.imsglobal.org/xsd/imsccv1p3/imswl_v1p3',
					'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
					'xsi:schemaLocation':
						'http://www.imsglobal.org/xsd/imsccv1p3/imswl_v1p3 http://www.imsglobal.org/profile/cc/ccv1p3/ccv1p3_imswl_v1p3.xsd',
				};
			default:
				throw createVersionNotSupportedError(this.props.version);
		}
	}
}
