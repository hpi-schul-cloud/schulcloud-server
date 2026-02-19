import { RoomOperation, RoomOperationValues } from '@modules/room-membership/authorization/room.rule';
import { RoomColor, RoomFeatures } from '@modules/room/domain/type';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsIn } from 'class-validator';

export class RoomDetailsResponse {
	@ApiProperty()
	public id: string;

	@ApiProperty()
	public name: string;

	@ApiProperty({ enum: RoomColor, enumName: 'RoomColor' })
	@IsEnum(RoomColor)
	public color: RoomColor;

	@ApiProperty()
	public schoolId: string;

	@ApiPropertyOptional({ type: Date })
	public startDate?: Date;

	@ApiPropertyOptional({ type: Date })
	public endDate?: Date;

	@ApiProperty({ type: Date })
	public createdAt: Date;

	@ApiProperty({ type: Date })
	public updatedAt: Date;

	@ApiProperty({
		type: 'object',
		properties: RoomOperationValues.reduce((acc, op) => {
			acc[op] = { type: 'boolean' };
			return acc;
		}, {}),
		additionalProperties: false,
		required: [...RoomOperationValues],
	})
	@IsIn(RoomOperationValues)
	public allowedOperations: Record<RoomOperation, boolean>;

	@ApiProperty({ enum: RoomFeatures, isArray: true, enumName: 'RoomFeatures' })
	public features: RoomFeatures[];

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
