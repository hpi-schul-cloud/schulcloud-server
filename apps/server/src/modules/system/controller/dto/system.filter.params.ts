import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { StringToBoolean } from '@shared/controller';

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
	@IsBoolean()
	@StringToBoolean()
	onlyOauth?: boolean;
}
