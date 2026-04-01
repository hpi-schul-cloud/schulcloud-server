import { ApiProperty } from '@nestjs/swagger';

export class DeletionRequestResponse {
	@ApiProperty()
	public requestId: string;

	@ApiProperty()
	public deletionPlannedAt: Date;

	constructor(response: DeletionRequestResponse) {
		this.requestId = response.requestId;
		this.deletionPlannedAt = response.deletionPlannedAt;
	}
}
