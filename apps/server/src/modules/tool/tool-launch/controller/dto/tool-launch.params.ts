import { IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ToolLaunchParams {
	@IsMongoId()
	@ApiProperty({ description: 'The id of the context external tool', nullable: false, required: true })
	contextExternalToolId!: string;
}
