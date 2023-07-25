import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsString } from 'class-validator';

export class SchoolExternalToolSearchParams {
	@ApiProperty()
	@IsString()
	@IsMongoId()
	schoolId!: string;
}
