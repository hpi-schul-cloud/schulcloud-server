import { RoomOperation, RoomOperationValues } from '@modules/room-membership/authorization/room.rule';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RoomArchivedItemResponse {
	@ApiProperty()
	id: string;

	@ApiProperty()
	name: string;

	@ApiPropertyOptional({ type: String })
	ownerName?: string;

	@ApiProperty({ type: Number })
	totalMembers: number;

	@ApiProperty({ type: Date })
	archivedAt: Date;

	@ApiProperty({ type: String })
	schoolName: string;

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

	constructor(props: RoomArchivedItemResponse) {
		this.id = props.id;
		this.name = props.name;
		this.ownerName = props.ownerName;
		this.totalMembers = props.totalMembers;
		this.archivedAt = props.archivedAt;
		this.schoolName = props.schoolName;
		this.allowedOperations = props.allowedOperations;
	}
}
