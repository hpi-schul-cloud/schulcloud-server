import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class ToolIdParams {
	@IsMongoId()
	@ApiProperty({ nullable: false, required: true })
	toolId!: string;
}
