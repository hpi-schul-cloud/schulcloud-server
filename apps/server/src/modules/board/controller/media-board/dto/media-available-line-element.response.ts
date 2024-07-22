import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MediaAvailableLineElementResponse {
	@ApiProperty({ description: 'School External tool id of the media available line element' })
	schoolExternalToolId: string;

	@ApiProperty({ description: 'Name of the media available line element' })
	name: string;

	@ApiPropertyOptional({ description: 'Description of the media available line element' })
	description?: string;

	@ApiPropertyOptional({ description: 'Logo url of the media available line element' })
	logoUrl?: string;

	constructor(props: MediaAvailableLineElementResponse) {
		this.schoolExternalToolId = props.schoolExternalToolId;
		this.name = props.name;
		this.description = props.description;
		this.logoUrl = props.logoUrl;
	}
}
