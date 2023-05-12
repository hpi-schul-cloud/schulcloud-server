import { IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class Lti11LaunchQuery {
	@IsMongoId()
	@ApiProperty({ nullable: false, required: true })
	courseId!: string;
}
