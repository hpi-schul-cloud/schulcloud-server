import { ApiProperty } from '@nestjs/swagger';
import { BlogFeedImageResponse } from './blog-feed-image-url-response';

export class BlogFeedDataResponse {
	@ApiProperty()
	title: string;

	@ApiProperty()
	pubDate: string;

	@ApiProperty()
	description: string;

	@ApiProperty()
	redirectUrl: string;

	@ApiProperty({ type: BlogFeedImageResponse })
	image: BlogFeedImageResponse;

	constructor(props: BlogFeedDataResponse) {
		this.title = props.title;
		this.pubDate = props.pubDate;
		this.description = props.description;
		this.redirectUrl = props.redirectUrl;
		this.image = props.image;
	}
}
