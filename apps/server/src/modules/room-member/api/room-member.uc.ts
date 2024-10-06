import { Injectable } from '@nestjs/common';
import { RoomMemberService } from '../service/room-member.service';

@Injectable()
export class RoomMembersUc {
	constructor(private readonly roomMembersService: RoomMemberService) {}

	// Add use case methods here later
}
