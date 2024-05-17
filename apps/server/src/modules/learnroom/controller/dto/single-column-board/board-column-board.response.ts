import { BoardLayout } from '@modules/board/domain';
import { ApiProperty } from '@nestjs/swagger';
import { DecodeHtmlEntities } from '@shared/controller';

export class BoardColumnBoardResponse {
	constructor({ id, columnBoardId, title, published, createdAt, updatedAt, layout }: BoardColumnBoardResponse) {
		this.id = id;
		this.columnBoardId = columnBoardId;
		this.title = title;
		this.published = published;
		this.createdAt = createdAt;
		this.updatedAt = updatedAt;
		this.layout = layout;
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

	@ApiProperty()
	columnBoardId: string;

	@ApiProperty()
	layout: BoardLayout;
}
