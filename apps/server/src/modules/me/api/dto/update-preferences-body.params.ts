import { ApiProperty } from '@nestjs/swagger';
import { IsDate } from 'class-validator';

export class UpdatePreferencesBodyParams {
	@ApiProperty()
	@IsDate()
	public releaseDate!: Date;
}
