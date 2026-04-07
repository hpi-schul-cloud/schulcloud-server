import { ApiProperty } from '@nestjs/swagger';

export class PseudonymResponse {
	@ApiProperty()
	public id: string;

	@ApiProperty()
	public toolId: string;

	@ApiProperty()
	public userId: string;

	constructor(response: PseudonymResponse) {
		this.id = response.id;
		this.toolId = response.toolId;
		this.userId = response.userId;
	}
}
