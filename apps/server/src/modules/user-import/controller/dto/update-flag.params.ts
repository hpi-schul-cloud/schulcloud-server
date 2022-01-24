import { ApiProperty } from '@nestjs/swagger';
import { StringToBoolean } from '@shared/controller';
import { IsBoolean } from 'class-validator';

export class UpdateFlagParams {
	@ApiProperty({ description: 'updates flag for an import user' })
	@StringToBoolean()
	@IsBoolean()
	flagged!: boolean;
}
