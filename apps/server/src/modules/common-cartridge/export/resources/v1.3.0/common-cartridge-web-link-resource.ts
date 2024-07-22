import {
	CommonCartridgeElementType,
	CommonCartridgeResourceType,
	CommonCartridgeVersion,
} from '../../common-cartridge.enums';
import { ElementTypeNotSupportedLoggableException } from '../../errors';
import { CommonCartridgeResource, XmlObject } from '../../interfaces';
import { buildXmlString, createIdentifier } from '../../utils';

export type CommonCartridgeWebLinkResourcePropsV130 = {
	type: CommonCartridgeResourceType.WEB_LINK;
	version: CommonCartridgeVersion;
	identifier: string;
	folder: string;
	title: string;
	url: string;
	target?: string;
	windowFeatures?: string;
};

export class CommonCartridgeWebLinkResourceV130 extends CommonCartridgeResource {
	constructor(private readonly props: CommonCartridgeWebLinkResourcePropsV130) {
		super(props);
	}

	public getSupportedVersion(): CommonCartridgeVersion {
		return CommonCartridgeVersion.V_1_3_0;
	}

	public getManifestXmlObject(elementType: CommonCartridgeElementType): XmlObject {
		switch (elementType) {
			case CommonCartridgeElementType.RESOURCE:
				return this.getManifestResourceXmlObject();
			case CommonCartridgeElementType.ORGANIZATION:
				return this.getManifestOrganizationXmlObject();
			default:
				throw new ElementTypeNotSupportedLoggableException(elementType);
		}
	}

	public getFilePath(): string {
		return `${this.props.folder}/${this.props.identifier}.xml`;
	}

	public getFileContent(): string {
		return buildXmlString({
			webLink: {
				$: {
					xmlns: 'http://www.imsglobal.org/xsd/imsccv1p3/imswl_v1p3',
					'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
					'xsi:schemaLocation':
						'http://www.imsglobal.org/xsd/imsccv1p3/imswl_v1p3 https://www.imsglobal.org/profile/cc/ccv1p3/ccv1p3_imswl_v1p3.xsd',
				},
				title: this.props.title,
				url: {
					$: {
						href: this.props.url,
						target: this.props.target,
						windowFeatures: this.props.windowFeatures,
					},
				},
			},
		});
	}

	private getManifestOrganizationXmlObject(): XmlObject {
		return {
			$: {
				identifier: createIdentifier(),
				identifierref: this.props.identifier,
			},
			title: this.props.title,
		};
	}

	private getManifestResourceXmlObject(): XmlObject {
		return {
			$: {
				identifier: this.props.identifier,
				type: 'imswl_xmlv1p3',
			},
			file: {
				$: {
					href: this.getFilePath(),
				},
			},
		};
	}
}
