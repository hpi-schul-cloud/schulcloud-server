import { RoomOperation, RoomOperationValues } from '@modules/room-membership/authorization/room.rule';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { RoomColor } from '../../../domain/type';

export class RoomItemResponse {
	@ApiProperty()
	id: string;

	@ApiProperty()
	name: string;

	@ApiProperty({ enum: RoomColor, enumName: 'RoomColor' })
	@IsEnum(RoomColor)
	color: RoomColor;

	@ApiProperty()
	schoolId: string;

	@ApiProperty({ type: Date })
	createdAt: Date;

	@ApiProperty({ type: Date })
	updatedAt: Date;

	@ApiProperty({
		type: 'object',
		properties: RoomOperationValues.reduce((acc, op) => {
			acc[op] = { type: 'boolean' };
			return acc;
		}, {}),
		additionalProperties: false,
		required: [...RoomOperationValues],
	})
	allowedOperations: Record<RoomOperation, boolean>;

	@ApiProperty({ type: Boolean })
	isLocked: boolean;

	@ApiProperty({ type: Number })
	totalMembers: number;

	constructor(room: RoomItemResponse) {
		this.id = room.id;
		this.name = room.name;
		this.color = room.color;
		this.schoolId = room.schoolId;

		this.createdAt = room.createdAt;
		this.updatedAt = room.updatedAt;

		this.allowedOperations = room.allowedOperations;
		this.isLocked = room.isLocked;
		this.totalMembers = room.totalMembers;
	}
}
