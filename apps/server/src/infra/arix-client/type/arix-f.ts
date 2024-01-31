import { ApiProperty } from '@nestjs/swagger';

export class ArixF {
	@ApiProperty({ description: 'A arix field' })
	n!: string;

	@ApiProperty({ description: 'A arix field value' })
	value!: string;
}
