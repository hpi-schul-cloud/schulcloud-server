import { ApiProperty } from '@nestjs/swagger';
import { DecodeHtmlEntities } from '@shared/controller';
import { BoardLayout } from '@shared/domain/domainobject';
import { ColumnResponse } from './column.response';
import { TimestampsResponse } from '../timestamps.response';

export class BoardResponse {
	constructor({ id, title, columns, timestamps, isVisible, layout }: BoardResponse) {
		this.id = id;
		this.title = title;
		this.columns = columns;
		this.timestamps = timestamps;
		this.isVisible = isVisible;
		this.layout = layout;
	}

	@ApiProperty({
		pattern: '[a-f0-9]{24}',
	})
	id: string;

	@ApiProperty()
	@DecodeHtmlEntities()
	title?: string;

	@ApiProperty({
		type: [ColumnResponse],
	})
	columns: ColumnResponse[];

	@ApiProperty()
	timestamps: TimestampsResponse;

	@ApiProperty()
	isVisible: boolean;

	@ApiProperty()
	layout: BoardLayout;
}
