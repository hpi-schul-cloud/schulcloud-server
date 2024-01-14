import { setupEntities, teamNewsFactory, userFactory } from '@shared/testing';
import { News } from './news.entity';

describe(News.name, () => {
	beforeAll(async () => {
		await setupEntities();
	});

	describe('removeCreatorReference', () => {
		describe('when called on a news that contains some creator with given refId', () => {
			const setup = () => {
				const creator = userFactory.buildWithId();
				const news = teamNewsFactory.build({
					creator,
				});

				const expectedNews = news;
				expectedNews.creator = undefined;

				return { creator, news, expectedNews };
			};
			it('should properly remove this creator reference', () => {
				const { creator, news, expectedNews } = setup();

				news.removeCreatorReference(creator.id);

				expect(news).toEqual(expectedNews);
			});
		});
	});
});
