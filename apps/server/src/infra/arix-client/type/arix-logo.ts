import { ApiProperty } from '@nestjs/swagger';

export class ArixLogo {
	@ApiProperty({ description: 'The logo as html' })
	value!: string;
}
