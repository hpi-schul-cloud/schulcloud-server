import { ApiProperty } from '@nestjs/swagger';

export enum RoomContentItemType {
	COLUMN_BOARD = 'column-board',
}

export class RoomContentItemResponse {
	@ApiProperty({ enum: RoomContentItemType, enumName: 'RoomContentItemType' })
	type: RoomContentItemType;

	@ApiProperty()
	id: string;

	@ApiProperty()
	name: string;

	@ApiProperty({ type: Date })
	createdAt: Date;

	@ApiProperty({ type: Date })
	updatedAt: Date;

	constructor(item: RoomContentItemResponse) {
		this.type = item.type;
		this.id = item.id;
		this.name = item.name;
		this.createdAt = item.createdAt;
		this.updatedAt = item.updatedAt;
	}
}
