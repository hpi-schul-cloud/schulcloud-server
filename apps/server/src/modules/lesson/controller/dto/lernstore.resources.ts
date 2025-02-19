import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LernstoreResources {
	@ApiProperty({ description: 'client' })
	public client: string;

	@ApiProperty({ description: 'description' })
	public description: string;

	@ApiPropertyOptional({ description: 'merlinReference' })
	public merlinReference?: string;

	@ApiProperty({ description: 'title' })
	public title: string;

	@ApiPropertyOptional({ description: 'url' })
	public url?: string;

	constructor(client: string, description: string, title: string, url?: string, merlinReference?: string) {
		this.client = client;
		this.description = description;
		this.title = title;
		this.url = url;
		this.merlinReference = merlinReference;
	}
}
