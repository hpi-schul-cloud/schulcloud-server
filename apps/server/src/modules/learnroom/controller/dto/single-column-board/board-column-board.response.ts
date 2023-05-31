import { ApiProperty } from '@nestjs/swagger';
import { DecodeHtmlEntities } from '@shared/controller';

export class BoardColumnBoardResponse {
	constructor({ id, title, published, createdAt, updatedAt }: BoardColumnBoardResponse) {
		this.id = id;
		this.title = title;
		this.published = published;
		this.createdAt = createdAt;
		this.updatedAt = updatedAt;
	}

	@ApiProperty()
	id: string;

	@ApiProperty()
	@DecodeHtmlEntities()
	title: string;

	@ApiProperty()
	published: boolean;

	@ApiProperty()
	createdAt: Date;

	@ApiProperty()
	updatedAt: Date;
}
