import { IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ToolIdParams {
	@IsMongoId()
	@ApiProperty({ nullable: false, required: true })
	externalToolId!: string;
}
