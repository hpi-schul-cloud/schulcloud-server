import { IImsccElement } from './imscc-element.interface';

export type IImsccMetadataProps = {
	identifier: string | number;
	title: string;
};

export class ImsccMetadataElement implements IImsccElement {
	constructor(private readonly props: IImsccMetadataProps) {}

	getElement(): Record<string, unknown> {
		return {
			schema: '1EdTech Thin Common Cartridge',
			schemaVersion: '1.3.2',
			lom: {
				$: {
					xmlns: 'http://ltsc.ieee.org/xsd/LOM',
					'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
					'xsi:schemaLocation': 'http://ltsc.ieee.org/xsd/LOM http://www.imsglobal.org/xsd/imsmd_loose_v1p3p2.xsd',
				},
				general: {
					title: {
						string: this.props.title,
					},
				},
			},
		};
	}
}
