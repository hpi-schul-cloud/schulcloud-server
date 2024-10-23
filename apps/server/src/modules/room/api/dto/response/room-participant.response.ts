import { ApiProperty } from '@nestjs/swagger';
import { PaginationResponse } from '@shared/controller';

export class RoomParticipantResponse {
	@ApiProperty()
	firstName!: string;

	@ApiProperty()
	lastName!: string;

	@ApiProperty()
	schoolName!: string;

	@ApiProperty()
	id!: string;

	constructor(props: RoomParticipantResponse) {
		this.id = props.id;
		this.firstName = props.firstName;
		this.lastName = props.lastName;
		this.schoolName = props.schoolName;
	}
}

export class RoomParticipantListResponse extends PaginationResponse<RoomParticipantResponse[]> {
	constructor(data: RoomParticipantResponse[], total: number, skip?: number, limit?: number) {
		super(total, skip, limit);
		this.data = data;
	}

	@ApiProperty({ type: [RoomParticipantResponse] })
	data: RoomParticipantResponse[];
}
