import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MediaSourceDataFormat } from '../../enum';

export class MediaSourceResponse {
	@ApiProperty({ type: String, description: 'Id of the media source' })
	public id: string;

	@ApiProperty({ type: String, description: 'External Id of the media source' })
	public sourceId: string;

	@ApiPropertyOptional({ type: String, description: 'Name of the media source' })
	public name?: string;

	@ApiPropertyOptional({
		enum: MediaSourceDataFormat,
		enumName: 'MediaSourceDataFormat',
		description: 'Format of the media source data',
	})
	public format?: MediaSourceDataFormat;

	constructor(response: MediaSourceResponse) {
		this.id = response.id;
		this.name = response.name;
		this.sourceId = response.sourceId;
		this.format = response.format;
	}
}
