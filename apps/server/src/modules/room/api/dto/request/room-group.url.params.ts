import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class RoomGroupUrlParams {
	@IsMongoId()
	@ApiProperty({ description: 'The id of the room group.', required: true, nullable: false })
	groupId!: string;
}
