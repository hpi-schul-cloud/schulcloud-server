import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SystemFilterParams {
	@ApiProperty({
		description: 'The type of the system.',
		required: false,
		nullable: true,
	})
	@IsOptional()
	@IsString()
	type?: string;

	@ApiProperty({
		description: 'Flag to request only systems with oauth-config.',
		required: false,
		nullable: true,
	})
	@IsOptional()
	@IsString()
	onlyOauth?: string;
}
