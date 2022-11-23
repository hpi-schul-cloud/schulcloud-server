import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ToolIdParams {
	@IsString()
	@ApiProperty({ nullable: false, required: true })
	toolId!: string;
}
