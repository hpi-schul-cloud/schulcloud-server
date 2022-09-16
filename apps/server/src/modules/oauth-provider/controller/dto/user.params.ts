import { IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UserParams {
	@IsMongoId()
	@ApiProperty({ description: 'The user id.', required: true, nullable: false })
	userId!: string;
}
