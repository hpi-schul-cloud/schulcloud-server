import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class ExternalToolIdParams {
	@IsMongoId()
	@ApiProperty({ nullable: false, required: true })
	externalToolId!: string;
}
