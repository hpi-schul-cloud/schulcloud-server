import { ApiProperty } from '@nestjs/swagger';
import { DecodeHtmlEntities } from '@shared/controller';
import { ColumnResponse } from './column.response';
import { TimestampsResponse } from '../timestamps.response';

export class BoardResponse {
	constructor({ id, title, columns, timestamps }: BoardResponse) {
		this.id = id;
		this.title = title;
		this.columns = columns;
		this.timestamps = timestamps;
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
}
