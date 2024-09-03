import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class CourseRoomElementUrlParams {
	@IsMongoId()
	@ApiProperty({
		description: 'The id of the room.',
		required: true,
		nullable: false,
	})
	roomId!: string;

	@IsMongoId()
	@ApiProperty({
		description: 'The id of the element within the room.',
		required: true,
		nullable: false,
	})
	elementId!: string;
}
