import { ApiProperty } from '@nestjs/swagger';

export class RoomStatsItemResponse {
	@ApiProperty({ type: String })
	public roomId: string;

	@ApiProperty({ type: String })
	public name: string;

	@ApiProperty({ type: String })
	public owner: string | undefined;

	@ApiProperty({ type: String })
	public schoolName: string;

	@ApiProperty({ type: Number })
	public totalMembers: number;

	@ApiProperty({ type: Number })
	public internalMembers: number;

	@ApiProperty({ type: Number })
	public externalMembers: number;

	@ApiProperty({ type: Date })
	public createdAt: Date;

	@ApiProperty({ type: Date })
	public updatedAt: Date;

	constructor(room: RoomStatsItemResponse) {
		this.roomId = room.roomId;
		this.name = room.name;
		this.owner = room.owner;
		this.schoolName = room.schoolName;
		this.totalMembers = room.totalMembers;
		this.internalMembers = room.internalMembers;
		this.externalMembers = room.externalMembers;
		this.createdAt = room.createdAt;
		this.updatedAt = room.updatedAt;
	}
}
