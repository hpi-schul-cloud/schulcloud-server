import { CommonCartridgeVersion } from '../common-cartridge.enums';
import { CommonCartridgeElement } from '../interfaces/common-cartridge-element.interface';

export type CommonCartridgeMetadataElementProps = {
	version: CommonCartridgeVersion;
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
