import { ApiProperty } from '@nestjs/swagger';

export class DeletionRequestResponse {
	@ApiProperty()
	requestId: string;

	@ApiProperty()
	deletionPlannedAt: Date;

	constructor(response: DeletionRequestResponse) {
		this.requestId = response.requestId;
		this.deletionPlannedAt = response.deletionPlannedAt;
	}
}
