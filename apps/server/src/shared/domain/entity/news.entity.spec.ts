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
	describe('removeUpdaterReference', () => {
		describe('when called on a news that contains some creator with given refId', () => {
			const setup = () => {
				const updater = userFactory.buildWithId();
				const news = teamNewsFactory.build({
					updater,
				});

				const expectedNews = news;
				expectedNews.updater = undefined;

				return { updater, news, expectedNews };
			};
			it('should properly remove this creator reference', () => {
				const { updater, news, expectedNews } = setup();

				news.removeUpdaterReference(updater.id);

				expect(news).toEqual(expectedNews);
			});
		});
	});
});
