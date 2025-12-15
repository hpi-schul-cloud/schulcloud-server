import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UpdateRuntimeConfigValueBodyParams {
	@IsString()
	@ApiProperty({ type: String })
	public value!: string;
}
