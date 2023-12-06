import { CommonCartridgeElementType, CommonCartridgeVersion } from '../../common-cartridge.enums';
import { CommonCartridgeElement } from '../../interfaces/common-cartridge-element.interface';

export type CommonCartridgeMetadataElementProps = {
	type: CommonCartridgeElementType.METADATA;
	version: CommonCartridgeVersion;
	title: string;
	creationDate: Date;
	copyrightOwners: string[];
};

export class CommonCartridgeMetadataElement extends CommonCartridgeElement {
	public constructor(private readonly props: CommonCartridgeMetadataElementProps) {
		super(props);
	}

	public override getSupportedVersion(): CommonCartridgeVersion {
		return CommonCartridgeVersion.V_1_1_0;
	}

	public override getManifestXmlObject(): Record<string, unknown> {
		return {
			schema: '1EdTech Common Cartridge',
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
						'mnf:string': `${this.props.creationDate.getFullYear()} ${this.props.copyrightOwners.join(
							', '
						)}`,
					},
				},
			},
		};
	}
}
