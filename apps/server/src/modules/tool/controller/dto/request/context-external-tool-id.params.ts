import { IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ContextExternalToolIdParams {
	@IsMongoId()
	@ApiProperty({ nullable: false, required: true })
	contextExternalToolId!: string;
}
