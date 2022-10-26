import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class Lti11LaunchParams {
	@IsMongoId()
	@ApiProperty({ nullable: false, required: true })
	toolId!: string;
}
