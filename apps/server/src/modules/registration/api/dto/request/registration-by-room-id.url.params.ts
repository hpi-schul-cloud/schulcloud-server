import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class RegistrationByRoomIdUrlParams {
	@IsMongoId()
	@ApiProperty({ description: 'The id of the room a registration is attached to.', required: true, nullable: false })
	public roomId!: string;
}
