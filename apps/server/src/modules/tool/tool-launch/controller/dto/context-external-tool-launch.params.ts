import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class ContextExternalToolLaunchParams {
	@IsMongoId()
	@ApiProperty({ description: 'The id of the context external tool', nullable: false, required: true })
	contextExternalToolId!: string;
}
