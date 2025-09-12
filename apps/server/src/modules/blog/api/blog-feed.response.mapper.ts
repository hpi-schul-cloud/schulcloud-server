import { BlogFeedDataResponse, BlogFeedImageResponse, BlogFeedResponse } from './dto';
import { BlogFeedResponseChannelItem } from './blog.uc';

export class BlogFeedResponseMapper {
	public static mapFromSourceData(sourceData: BlogFeedResponseChannelItem[]): BlogFeedResponse {
		const items = sourceData.map((data: BlogFeedResponseChannelItem) => {
			const date = new Date(data.pubDate);
			const locale = 'en-us';
			const month = date.toLocaleString(locale, { month: 'long' });
			const responseItem = new BlogFeedDataResponse({
				title: data.title,
				pubDate: `${date.getDate()}. ${month}`,
				description: data.description,
				redirectUrl: data.link as string,
				image: new BlogFeedImageResponse({
					url: data['media:content']?.['@_url'] as string,
					alt: data.title,
				}),
			});

			return responseItem;
		});

		const response = new BlogFeedResponse({ blogFeed: items });

		return response;
	}
}
