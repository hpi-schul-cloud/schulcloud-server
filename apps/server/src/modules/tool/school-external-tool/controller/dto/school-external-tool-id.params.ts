import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class SchoolExternalToolIdParams {
	@IsMongoId()
	@ApiProperty({ nullable: false, required: true })
	schoolExternalToolId!: string;
}
