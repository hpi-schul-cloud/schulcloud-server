import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class CourseRoomUrlParams {
	@IsMongoId()
	@ApiProperty({
		description: 'The id of the room.',
		required: true,
		nullable: false,
	})
	roomId!: string;
}
