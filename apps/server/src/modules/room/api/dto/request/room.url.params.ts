import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class RoomUrlParams {
	@IsMongoId()
	@ApiProperty()
	roomId!: string;
}
