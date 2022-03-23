import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateFlagParams {
	@ApiProperty({ description: 'updates flag for an import user' })
	@IsBoolean()
	flagged!: boolean;
}
