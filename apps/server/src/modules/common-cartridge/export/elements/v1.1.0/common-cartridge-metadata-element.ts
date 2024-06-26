import { CommonCartridgeElementType, CommonCartridgeVersion } from '../../common-cartridge.enums';
import { ElementTypeNotSupportedLoggableException } from '../../errors';
import { CommonCartridgeElement, XmlObject } from '../../interfaces';

export type CommonCartridgeMetadataElementPropsV110 = {
	type: CommonCartridgeElementType.METADATA;
	version: CommonCartridgeVersion;
	title: string;
	creationDate: Date;
	copyrightOwners: string[];
};

export class CommonCartridgeMetadataElementV110 extends CommonCartridgeElement {
	constructor(private readonly props: CommonCartridgeMetadataElementPropsV110) {
		super(props);
	}

	public getSupportedVersion(): CommonCartridgeVersion {
		return CommonCartridgeVersion.V_1_1_0;
	}

	public getManifestXmlObject(elementType: CommonCartridgeElementType): XmlObject {
		switch (elementType) {
			case CommonCartridgeElementType.METADATA:
				return this.getManifestMetadataXmlObjectInternal();
			default:
				throw new ElementTypeNotSupportedLoggableException(elementType);
		}
	}

	private getManifestMetadataXmlObjectInternal() {
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
