import { CommonCartridgeElementType, CommonCartridgeVersion } from '../../common-cartridge.enums';
import { CommonCartridgeElement, XmlObject } from '../../interfaces';

export type CommonCartridgeMetadataElementPropsV130 = {
	type: CommonCartridgeElementType.METADATA;
	version: CommonCartridgeVersion;
	title: string;
	creationDate: Date;
	copyrightOwners: string[];
};

export class CommonCartridgeMetadataElementV130 extends CommonCartridgeElement {
	constructor(private readonly props: CommonCartridgeMetadataElementPropsV130) {
		super(props);
	}

	public getSupportedVersion(): CommonCartridgeVersion {
		return CommonCartridgeVersion.V_1_3_0;
	}

	public getManifestXmlObject(): XmlObject {
		return {
			schema: 'IMS Common Cartridge',
			schemaversion: '1.3.0',
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
