import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UpdateRuntimeConfigValueUrlParams {
	@IsString()
	@ApiProperty({ description: 'The key of the runtime config value.', required: true, nullable: false })
	public key!: string;
}
