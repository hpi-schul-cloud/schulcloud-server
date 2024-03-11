import { ApiProperty } from '@nestjs/swagger';

export class CreateBoardResponse {
	constructor({ id }: CreateBoardResponse) {
		this.id = id;
	}

	@ApiProperty({
		pattern: '[a-f0-9]{24}',
	})
	id: string;
}
