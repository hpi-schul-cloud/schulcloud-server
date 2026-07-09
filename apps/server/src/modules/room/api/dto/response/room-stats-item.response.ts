import { ApiProperty } from '@nestjs/swagger';

export class RoomStatsItemResponse {
	@ApiProperty({ type: String })
	roomId: string;

	@ApiProperty({ type: String })
	name: string;

	@ApiProperty({ type: String })
	owner: string | undefined;

	@ApiProperty({ type: String })
	schoolId: string;

	@ApiProperty({ type: String })
	schoolName: string;

	@ApiProperty({ type: Number })
	totalMembers: number;

	@ApiProperty({ type: Number })
	internalMembers: number;

	@ApiProperty({ type: Number })
	externalMembers: number;

	@ApiProperty({ type: Date })
	createdAt: Date;

	@ApiProperty({ type: Date })
	updatedAt: Date;

	constructor(room: RoomStatsItemResponse) {
		this.roomId = room.roomId;
		this.name = room.name;
		this.owner = room.owner;
		this.schoolId = room.schoolId;
		this.schoolName = room.schoolName;
		this.totalMembers = room.totalMembers;
		this.internalMembers = room.internalMembers;
		this.externalMembers = room.externalMembers;
		this.createdAt = room.createdAt;
		this.updatedAt = room.updatedAt;
	}
}
