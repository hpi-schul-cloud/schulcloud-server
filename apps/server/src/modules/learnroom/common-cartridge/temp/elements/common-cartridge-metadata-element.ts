import { CommonCartridgeElement } from '../interfaces/common-cartridge-element.interface';

type CommonCartridgeMetadataElementProps = {
	version: string;
	title: string;
	creationDate: Date;
	copyrightOwners: string[];
};

export class CommonCartridgeMetadataElement implements CommonCartridgeElement {
	constructor(private readonly props: CommonCartridgeMetadataElementProps) {}

	getManifestXml(): Record<string, unknown> {
		return {
			schema: 'IMS Common Cartridge',
			schemaversion: this.props.version,
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
