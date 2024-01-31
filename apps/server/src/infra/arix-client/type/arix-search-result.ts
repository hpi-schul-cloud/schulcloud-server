import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArixR } from './arix-r';

export class ArixSearchResult {
	@ApiProperty({
		description: 'A arix media record',
		type: [ArixR],
		example: {
			r: [
				{
					f: [
						{
							value: '2099-12-31',
							n: 'licence',
						},
						{
							value:
								'"Bei unserer Lebensweise ist es sehr angenehm, lange im Voraus zu einer Party eingeladen zu werden" von Jane Bowles/Katharina Franck',
							n: 'titel',
						},
					],
					identifier: 'sodix-SODIX_0001019990',
				},
				{
					f: [
						{
							value: '2099-12-31',
							n: 'licence',
						},
						{
							value: '"bin pleite ohne mich ". Leben mit der Privatinsolvenz',
							n: 'titel',
						},
					],
					identifier: 'sodix-SODIX_0001019988',
				},
			],
		},
	})
	r!: ArixR[];

	@ApiPropertyOptional({ description: 'Shows with "0" or "1" if more records are available' })
	resume?: '0' | '1';
}
