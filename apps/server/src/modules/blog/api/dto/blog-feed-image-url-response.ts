import { ApiProperty } from '@nestjs/swagger';

export class BlogFeedImageResponse {
	@ApiProperty()
	url: string;

	@ApiProperty()
	alt: string;

	constructor(props: BlogFeedImageResponse) {
		this.url = props.url;
		this.alt = props.alt;
	}
}
