import { ApiProperty } from '@nestjs/swagger';

export class ShortNodeResponse {
	constructor({ id, title }: ShortNodeResponse) {
		this.id = id;
		this.title = title;
	}

	@ApiProperty()
	public id: string;

	@ApiProperty()
	public title?: string;
}
