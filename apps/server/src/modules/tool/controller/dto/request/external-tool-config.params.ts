import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ExternalToolConfigCreateParams {
	@IsString()
	@ApiProperty()
	type!: string;

	@IsString()
	@ApiProperty()
	baseUrl!: string;
}
