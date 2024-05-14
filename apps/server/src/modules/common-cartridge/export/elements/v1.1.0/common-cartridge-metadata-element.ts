import { CommonCartridgeElementType, CommonCartridgeVersion } from '../../common-cartridge.enums';
import { CommonCartridgeBase, CommonCartridgeElement, XmlObject } from '../../interfaces';

export type CommonCartridgeMetadataElementPropsV110 = {
	type: CommonCartridgeElementType.METADATA;
	version: CommonCartridgeVersion;
	title: string;
	creationDate: Date;
	copyrightOwners: string[];
};

export class CommonCartridgeMetadataElementV110 extends CommonCartridgeBase implements CommonCartridgeElement {
	constructor(private readonly props: CommonCartridgeMetadataElementPropsV110) {
		super(props);
	}

	public getSupportedVersion(): CommonCartridgeVersion {
		return CommonCartridgeVersion.V_1_1_0;
	}

	public getManifestXmlObject(): XmlObject {
		return {
			schema: 'IMS Common Cartridge',
			schemaversion: '1.1.0',
			'mnf:lom': {
				'mnf:general': {
					'mnf:title': {
						'mnf:string': this.props.title,
					},
				},
				'mnf:rights': {
					'mnf:copyrightAndOtherRestrictions': {
						'mnf:value': 'yes',
					},
					'mnf:description': {
						'mnf:string': `${this.props.creationDate.getFullYear()} ${this.props.copyrightOwners.join(', ')}`,
					},
				},
			},
		};
	}
}
