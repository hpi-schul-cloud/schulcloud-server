import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class UserParams {
	@IsMongoId()
	@ApiProperty({ description: 'The user id.', required: true, nullable: false })
	userId!: string;
}
