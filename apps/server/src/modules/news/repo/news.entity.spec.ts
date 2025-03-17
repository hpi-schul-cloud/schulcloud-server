import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { setupEntities } from '@testing/database';
import { teamNewsFactory } from '../testing';
import { News } from './news.entity';

describe(News.name, () => {
	beforeAll(async () => {
		await setupEntities([User]);
	});

	describe('removeCreatorReference', () => {
		describe('when called on a news that contains some creator with given refId', () => {
			const setup = () => {
				const creator = userFactory.buildWithId();
				const news = teamNewsFactory.build({
					creator,
				});

				return { creator, news };
			};
			it('should properly remove this creator reference', () => {
				const { creator, news } = setup();

				news.removeCreatorReference(creator.id);

				expect(news.creator).toEqual(undefined);
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

				return { updater, news };
			};
			it('should properly remove this updater reference', () => {
				const { updater, news } = setup();

				news.removeUpdaterReference(updater.id);

				expect(news.updater).toEqual(undefined);
			});
		});
	});
});
