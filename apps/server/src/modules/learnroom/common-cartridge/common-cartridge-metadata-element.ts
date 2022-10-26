import { ICommonCartridgeElement } from './common-cartridge-element.interface';

export type ICommonCartridgeMetadataProps = {
	title: string;
};

export class CommonCartridgeMetadataElement implements ICommonCartridgeElement {
	constructor(private readonly props: ICommonCartridgeMetadataProps) {}

	transform(): Record<string, unknown> {
		return {
			schema: 'IMS Common Cartridge',
			schemaversion: '1.3.0',
			'lommanifest:lom': {
				'lommanifest:general': {
					'lommanifest:title': {
						'lommanifest:string': this.props.title,
					},
				},
			},
		};
	}
}
