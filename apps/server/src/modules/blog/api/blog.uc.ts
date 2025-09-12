import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { XMLParser } from 'fast-xml-parser';
import { Injectable } from '@nestjs/common';

export type BlogFeedResponseChannelItem = {
	title: string;
	pubDate: string;
	description: string;
	'media:content'?: { '@_url': string };
	link?: string;
};

type BlogFeedSourceDataResponse = {
	rss: {
		channel: { item: BlogFeedResponseChannelItem[] };
	};
};

@Injectable()
export class BlogUc {
	constructor(private readonly httpService: HttpService, private readonly configService: ConfigService) {}

	public async fetchBlogFeed(): Promise<BlogFeedResponseChannelItem[]> {
		const blogFeedUrl = new URL('/rss', this.configService.getOrThrow('GHOST_BASE_URL'));

		const response = await lastValueFrom(this.httpService.get<string>(blogFeedUrl.href));

		const parser = new XMLParser({
			ignoreAttributes: false,
			attributeNamePrefix: '@_',
		});

		const blogFeed: BlogFeedSourceDataResponse = parser.parse(response.data);
		const filteredFeed = blogFeed.rss.channel.item
			.filter((item) => item['media:content'] !== undefined && item.link)
			.slice(0, 3);

		return filteredFeed;
	}
}
