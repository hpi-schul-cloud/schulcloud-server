import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReleaseItemResponse {
	@ApiProperty()
	id: string;

	@ApiProperty()
	name: string;

	@ApiProperty()
	body: string;

	@ApiProperty()
	url: string;

	@ApiProperty()
	author: string;

	@ApiProperty()
	authorUrl: string;

	@ApiProperty({ type: Date })
	createdAt: Date;

	@ApiProperty({ type: Date })
	publishedAt: Date;

	@ApiPropertyOptional()
	zipUrl?: string;

	constructor(release: ReleaseItemResponse) {
		this.id = release.id;
		this.name = release.name;
		this.body = release.body;
		this.url = release.url;
		this.author = release.author;
		this.authorUrl = release.authorUrl;
		this.createdAt = release.createdAt;
		this.publishedAt = release.publishedAt;
		this.zipUrl = release.zipUrl;
	}
}
