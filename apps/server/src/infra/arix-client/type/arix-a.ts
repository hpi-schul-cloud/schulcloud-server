import { ApiProperty } from '@nestjs/swagger';
import { ArixUrlArt } from './arix-url-art';

export class ArixA {
	@ApiProperty({ description: 'A arix link' })
	href!: string;

	@ApiProperty({ description: 'A arix link type', enum: ArixUrlArt })
	value!: ArixUrlArt;
}
