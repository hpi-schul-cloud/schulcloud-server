import { ApiProperty } from '@nestjs/swagger';

export class ExternalToolMediumMetadataResponse {
	@ApiProperty()
	name: string;

	@ApiProperty()
	description: string | undefined;

	@ApiProperty()
	publisher: string | undefined;

	@ApiProperty()
	logoUrl: string | undefined;

	@ApiProperty()
	previewLogoUrl: string | undefined;

	@ApiProperty()
	modified: Date | undefined;

	constructor(response: ExternalToolMediumMetadataResponse) {
		this.name = response.name;
		this.description = response.description;
		this.publisher = response.publisher;
		this.logoUrl = response.logoUrl;
		this.previewLogoUrl = response.previewLogoUrl;
		this.modified = response.modified;
	}
}
