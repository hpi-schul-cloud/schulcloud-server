import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReleaseItemResponse {
	@ApiProperty()
	public id: string;

	@ApiProperty()
	public name: string;

	@ApiProperty()
	public body: string;

	@ApiProperty()
	public url: string;

	@ApiProperty()
	public author: string;

	@ApiProperty()
	public authorUrl: string;

	@ApiProperty({ type: Date })
	public createdAt: Date;

	@ApiProperty({ type: Date })
	public publishedAt: Date;

	@ApiPropertyOptional()
	public zipUrl?: string;

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
