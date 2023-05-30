import { ICommonCartridgeElement } from './common-cartridge-element.interface';

export type ICommonCartridgeMetadataProps = {
	title: string;
	copyrightOwners: string;
	creationYear: string;
	version: string;
};

export class CommonCartridgeMetadataElement implements ICommonCartridgeElement {
	constructor(private readonly props: ICommonCartridgeMetadataProps) {}

	transform(): Record<string, unknown> {
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
						'mnf:string': `${this.props.creationYear} ${this.props.copyrightOwners}`,
					},
				},
			},
		};
	}
}
