import { ICommonCartridgeElement } from './common-cartridge-element.interface';

export type ICommonCartridgeMetadataProps = {
	title: string;
	copyrightOwners: string;
	currentYear: string;
};

export class CommonCartridgeMetadataElement implements ICommonCartridgeElement {
	constructor(private readonly props: ICommonCartridgeMetadataProps) {}

	transform(): Record<string, unknown> {
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
						'mnf:string': `${this.props.currentYear} ${this.props.copyrightOwners}`,
					},
				},
			},
		};
	}
}
