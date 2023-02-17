import { ApiPropertyOptional } from '@nestjs/swagger';

export class VisibilitySettingsResponse {
	constructor({ publishedAt }: VisibilitySettingsResponse) {
		this.publishedAt = publishedAt;
	}

	@ApiPropertyOptional()
	publishedAt?: string;
}
