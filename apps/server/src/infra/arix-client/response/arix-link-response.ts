import { ApiProperty } from '@nestjs/swagger';
import { ArixLink } from '../type/arix-link';

export class ArixLinkResponse {
	@ApiProperty({
		description: 'A arix link',
		example: {
			a: [
				{
					value: 'direct',
					href: 'https://xplay.datenbank-bildungsmedien.net/390eb80a7e707ca30b6ca4f8166e62c0/XMEDIENLB-5552796/index.html',
				},
				{
					value: 'download',
					href: 'https://xplay.datenbank-bildungsmedien.net/390eb80a7e707ca30b6ca4f8166e62c0/XMEDIENLB-5552796-download/5552796_Basiswissen_Politik.zip',
				},
			],
			size: '2.77 GB',
		},
	})
	link!: ArixLink;
}
