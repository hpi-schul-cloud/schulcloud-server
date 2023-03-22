import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CustomParameterEntryParam {
	@IsString()
	@ApiProperty()
	name!: string;

	@IsString()
	@IsOptional()
	@ApiPropertyOptional()
	value?: string;
}
