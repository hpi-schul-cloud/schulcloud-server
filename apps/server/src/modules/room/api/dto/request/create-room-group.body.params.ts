import { ApiProperty } from '@nestjs/swagger';
import { PrivacyProtect } from '@shared/controller/validator';
import { IsString, MaxLength } from 'class-validator';
import { RoomArrangementRevisionBodyParams } from './room-arrangement-revision.body.params';

export class CreateRoomGroupBodyParams extends RoomArrangementRevisionBodyParams {
	@PrivacyProtect()
	@IsString()
	@MaxLength(1000)
	@ApiProperty({
		description: 'The name of the group. It is trimmed and NFC-normalized and must have 1 to 100 characters.',
		required: true,
		nullable: false,
	})
	name!: string;
}
