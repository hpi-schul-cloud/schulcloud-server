import { ApiProperty } from '@nestjs/swagger';
import { DecodeHtmlEntities } from '@shared/controller/transformer';
import { BoardFeature, BoardLayout } from '../../../domain';
import { TimestampsResponse } from '../timestamps.response';
import { ColumnResponse } from './column.response';

export class BoardResponse {
	constructor({ id, title, columns, timestamps, isVisible, layout, features }: BoardResponse) {
		this.id = id;
		this.title = title;
		this.columns = columns;
		this.timestamps = timestamps;
		this.isVisible = isVisible;
		this.layout = layout;
		this.features = features;
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

	@ApiProperty({ enum: BoardFeature, isArray: true, enumName: 'BoardFeature' })
	features: BoardFeature[];
}
