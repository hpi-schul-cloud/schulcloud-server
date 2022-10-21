import { IImsccElement } from './imscc-element.interface';

export type IImsccMetadataProps = {
	title: string;
};

export class ImsccMetadataElement implements IImsccElement {
	constructor(private readonly props: IImsccMetadataProps) {}

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
