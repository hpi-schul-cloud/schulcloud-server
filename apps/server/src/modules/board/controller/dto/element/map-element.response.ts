import { ApiProperty } from '@nestjs/swagger';
import { bsonStringPattern } from '@shared/controller/bson-string-pattern';
import { ContentElementType } from '../../../domain';
import { TimestampsResponse } from '../timestamps.response';

export class MapElementContent {
	constructor({ centerLat, centerLng, zoom, features }: MapElementContent) {
		this.centerLat = centerLat;
		this.centerLng = centerLng;
		this.zoom = zoom;
		this.features = features;
	}

	@ApiProperty()
	centerLat: number;

	@ApiProperty()
	centerLng: number;

	@ApiProperty()
	zoom: number;

	@ApiProperty()
	features: string;
}

export class MapElementResponse {
	constructor({ id, content, timestamps, type }: MapElementResponse) {
		this.id = id;
		this.timestamps = timestamps;
		this.type = type;
		this.content = content;
	}

	@ApiProperty({ pattern: bsonStringPattern })
	id: string;

	@ApiProperty({ enum: ContentElementType, enumName: 'ContentElementType' })
	type: ContentElementType.MAP;

	@ApiProperty()
	timestamps: TimestampsResponse;

	@ApiProperty()
	content: MapElementContent;
}
