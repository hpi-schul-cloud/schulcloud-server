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

	constructor(props: Readonly<LernstoreResources>) {
		this.client = props.client;
		this.description = props.description;
		this.title = props.title;
		this.url = props.url;
		this.merlinReference = props.merlinReference;
	}
}
