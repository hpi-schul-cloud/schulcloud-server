import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class CourseSyncBodyParams {
	@IsMongoId()
	@ApiProperty({
		description: 'The id of the group',
		required: true,
		nullable: false,
	})
	groupId!: string;
}
