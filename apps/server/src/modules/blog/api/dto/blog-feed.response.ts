import { ApiProperty } from '@nestjs/swagger';
import { BlogFeedDataResponse } from './blog-feed-data.response';

export class BlogFeedResponse {
	@ApiProperty({ type: [BlogFeedDataResponse] })
	blogFeed: BlogFeedDataResponse[];

	constructor(props: BlogFeedResponse) {
		this.blogFeed = props.blogFeed;
	}
}
