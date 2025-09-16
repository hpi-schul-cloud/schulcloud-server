import { ApiProperty } from '@nestjs/swagger';
import { bsonStringPattern } from '@shared/controller/bson-string-pattern';
import { DecodeHtmlEntities } from '@shared/controller/transformer';
import { Permission } from '@shared/domain/interface/permission.enum';
import { BoardFeature, BoardLayout } from '../../../domain';
import { TimestampsResponse } from '../timestamps.response';
import { ColumnResponse } from './column.response';

export class BoardResponse {
	constructor({
		id,
		title,
		columns,
		timestamps,
		isVisible,
		readersCanEdit,
		layout,
		features,
		permissions,
	}: BoardResponse) {
		this.id = id;
		this.title = title;
		this.columns = columns;
		this.timestamps = timestamps;
		this.isVisible = isVisible;
		this.readersCanEdit = readersCanEdit;
		this.layout = layout;
		this.features = features;
		this.permissions = permissions;
	}

	@ApiProperty({
		pattern: bsonStringPattern,
	})
	public id: string;

	@ApiProperty()
	@DecodeHtmlEntities()
	public title?: string;

	@ApiProperty({
		type: [ColumnResponse],
	})
	public columns: ColumnResponse[];

	@ApiProperty()
	public timestamps: TimestampsResponse;

	@ApiProperty()
	public isVisible: boolean;

	@ApiProperty()
	public readersCanEdit: boolean;

	@ApiProperty({ enum: BoardLayout, enumName: 'BoardLayout' })
	public layout: BoardLayout;

	@ApiProperty({ enum: BoardFeature, isArray: true, enumName: 'BoardFeature' })
	public features: BoardFeature[];

	@ApiProperty({ enum: Permission, isArray: true, enumName: 'Permission' })
	public permissions: Permission[];
}
