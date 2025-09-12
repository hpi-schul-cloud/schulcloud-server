import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { BlogUc } from '@modules/blog/api/blog.uc';
import { BlogFeedResponseMapper } from '@modules/blog/api/blog-feed.response.mapper';
import { BlogFeedResponse } from '@modules/blog/api/dto';

@ApiTags('Blog')
@Controller('blog')
export class BlogController {
	constructor(private readonly blogUc: BlogUc) {}

	@Get('/feed')
	@ApiOperation({
		summary: 'Returns data for the blog feed to be shown in the home page.',
	})
	public async fetchBlogFeed(): Promise<BlogFeedResponse> {
		const rawFeedData = await this.blogUc.fetchBlogFeed();

		const response = BlogFeedResponseMapper.mapFromSourceData(rawFeedData);

		return response;
	}
}
