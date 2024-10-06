import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RoomMembersUc } from './room-member.uc';

@ApiTags('Room Members')
@Controller('room-members')
export class RoomMembersController {
	constructor(private readonly roomMembersUc: RoomMembersUc) {}

	// Add endpoints here later
}
