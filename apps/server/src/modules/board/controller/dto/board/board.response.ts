import { ApiProperty } from '@nestjs/swagger';
import { bsonStringPattern } from '@shared/controller/bson-string-pattern';
import { DecodeHtmlEntities } from '@shared/controller/transformer';
import { Permission } from '@shared/domain/interface/permission.enum';
import { BoardFeature, BoardLayout } from '../../../domain';
import { TimestampsResponse } from '../timestamps.response';
import { ColumnResponse } from './column.response';

export class BoardResponse {
	constructor({ id, title, columns, timestamps, isVisible, layout, features, permissions }: BoardResponse) {
		this.id = id;
		this.title = title;
		this.columns = columns;
		this.timestamps = timestamps;
		this.isVisible = isVisible;
		this.layout = layout;
		this.features = features;
		this.permissions = permissions;
	}

	@ApiProperty({
		pattern: bsonStringPattern,
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

	@ApiProperty({ enum: BoardLayout, enumName: 'BoardLayout' })
	layout: BoardLayout;

	@ApiProperty({ enum: BoardFeature, isArray: true, enumName: 'BoardFeature' })
	features: BoardFeature[];

	@ApiProperty({ enum: Permission, isArray: true, enumName: 'Permission' })
	permissions: Permission[];
}
