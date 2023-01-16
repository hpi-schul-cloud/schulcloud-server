import { IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SchoolExternalToolIdParams {
	@IsMongoId()
	@ApiProperty({ nullable: false, required: true })
	schoolExternalToolId!: string;
}
