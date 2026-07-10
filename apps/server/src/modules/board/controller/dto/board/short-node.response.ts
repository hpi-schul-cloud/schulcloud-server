import { ApiProperty } from '@nestjs/swagger';

export class ShortNodeResponse {
	constructor({ id, title }: ShortNodeResponse) {
		this.id = id;
		this.title = title;
	}

	@ApiProperty()
	id: string;

	@ApiProperty()
	title?: string;
}
