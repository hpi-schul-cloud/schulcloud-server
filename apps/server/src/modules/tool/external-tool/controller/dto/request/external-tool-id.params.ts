import { IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ExternalToolIdParams {
	@IsMongoId()
	@ApiProperty({ nullable: false, required: true })
	externalToolId!: string;
}
