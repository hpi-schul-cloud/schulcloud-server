import { ApiProperty } from '@nestjs/swagger';

export class LessonResources {
	@ApiProperty({ description: 'client' })
	client: string;

	@ApiProperty({ description: 'description' })
	description: string;

	@ApiProperty({ description: 'merlinReference' })
	merlinReference?: string;

	@ApiProperty({ description: 'title' })
	title: string;

	@ApiProperty({ description: 'url' })
	url?: string;

	constructor(client: string, description: string, title: string, url: string, merlinReference?: string) {
		this.client = client;
		this.description = description;
		this.title = title;
		this.url = url;
		this.merlinReference = merlinReference;
	}
}
