import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class ReadersCanEditBodyParams {
	@IsBoolean()
	@ApiProperty({
		required: true,
		type: 'boolean',
	})
	public readersCanEdit!: boolean;
}
