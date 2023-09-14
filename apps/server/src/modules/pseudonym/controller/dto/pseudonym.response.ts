import { ApiProperty } from '@nestjs/swagger';

export class PseudonymResponse {
	@ApiProperty()
	id: string;

	@ApiProperty()
	toolId: string;

	@ApiProperty()
	userId: string;

	constructor(response: PseudonymResponse) {
		this.id = response.id;
		this.toolId = response.toolId;
		this.userId = response.userId;
	}
}
