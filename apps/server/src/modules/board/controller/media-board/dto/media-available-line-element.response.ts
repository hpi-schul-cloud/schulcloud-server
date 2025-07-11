import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MediaAvailableLineElementResponse {
	@ApiProperty({ description: 'School External tool id of the media available line element' })
	schoolExternalToolId: string;

	@ApiProperty({ description: 'Name of the media available line element' })
	name: string;

	@ApiProperty({ description: 'Domain of the tool url' })
	domain: string;

	@ApiPropertyOptional({ description: 'Description of the media available line element' })
	description?: string;

	@ApiPropertyOptional({ description: 'Logo url of the media available line element' })
	logoUrl?: string;

	@ApiPropertyOptional({ description: 'Thumbnail url of the media available line element' })
	thumbnailUrl?: string;

	constructor(props: MediaAvailableLineElementResponse) {
		this.schoolExternalToolId = props.schoolExternalToolId;
		this.name = props.name;
		this.description = props.description;
		this.logoUrl = props.logoUrl;
		this.thumbnailUrl = props.thumbnailUrl;
		this.domain = props.domain;
	}
}
