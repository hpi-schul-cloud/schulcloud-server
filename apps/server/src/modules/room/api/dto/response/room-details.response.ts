import { RoomOperation, RoomOperationValues } from '@modules/room-membership/authorization/room.rule';
import { RoomColor, RoomFeatures } from '@modules/room/domain/type';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export class RoomDetailsResponse {
	@ApiProperty()
	id: string;

	@ApiProperty()
	name: string;

	@ApiProperty({ enum: RoomColor, enumName: 'RoomColor' })
	@IsEnum(RoomColor)
	color: RoomColor;

	@ApiProperty()
	schoolId: string;

	@ApiPropertyOptional({ type: Date })
	startDate?: Date;

	@ApiPropertyOptional({ type: Date })
	endDate?: Date;

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

	@ApiProperty({ enum: RoomFeatures, isArray: true, enumName: 'RoomFeatures' })
	features: RoomFeatures[];

	constructor(room: RoomDetailsResponse) {
		this.id = room.id;
		this.name = room.name;
		this.color = room.color;
		this.schoolId = room.schoolId;

		this.startDate = room.startDate;
		this.endDate = room.endDate;
		this.createdAt = room.createdAt;
		this.updatedAt = room.updatedAt;

		this.allowedOperations = room.allowedOperations;
		this.features = room.features;
	}
}
