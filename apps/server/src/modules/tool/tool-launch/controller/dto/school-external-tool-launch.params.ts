import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class SchoolExternalToolLaunchParams {
	@IsMongoId()
	@ApiProperty({ description: 'The id of the school external tool' })
	schoolExternalToolId!: string;
}
