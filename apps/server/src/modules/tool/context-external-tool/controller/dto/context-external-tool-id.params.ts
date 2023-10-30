import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class ContextExternalToolIdParams {
	@IsMongoId()
	@ApiProperty({ nullable: false, required: true })
	contextExternalToolId!: string;
}
