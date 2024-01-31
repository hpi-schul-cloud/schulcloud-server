import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArixA } from './arix-a';

export class ArixLink {
	@ApiProperty({ description: 'A arix link', type: [ArixA] })
	a!: ArixA[];

	@ApiPropertyOptional({ description: 'A arix link size' })
	size?: string;
}
