import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Permission } from '@shared/domain/interface';
import { RoomColor, RoomFeatures } from '@modules/room/domain/type';
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

	@ApiProperty({ enum: Permission, isArray: true, enumName: 'Permission' })
	permissions: Permission[];

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

		this.permissions = room.permissions;
		this.features = room.features;
	}
}
