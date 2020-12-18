import { expect } from 'chai';
import mongooseImport from 'mongoose'; 
const { ObjectId } = mongooseImport.Types;
import appPromise from '../../../../src/app';
import testObjectsImport from '../../helpers/testObjects'; 
const { cleanup } = testObjectsImport(appPromise);
import { newsHistoryModel } from '../../../../src/services/news/model';
import { preparePagination, deleteNewsHistory } from '../../../../src/services/news/hooks/news.hooks';

describe('news hooks', () => {
	let app;

	before(async () => {
		app = await appPromise;
	})

	describe('#preparePagination', () => {
		it('should convert the $paginate query parameter from a string to boolean', () => {
			const context = {
				params: {
					query: {
						$paginate: 'true',
					},
				},
			};
			expect(() => preparePagination(context)).not.to.throw(Error);
			expect(preparePagination(context).params.query).to.deep.equal({ $paginate: true });

			context.params.query.$paginate = 'false';
			expect(() => preparePagination(context)).not.to.throw(Error);
			expect(preparePagination(context).params.query).to.deep.equal({ $paginate: false });
		});

		it('should work if no query is given', () => {
			const context = {
				params: {},
			};
			expect(() => preparePagination(context)).not.to.throw(Error);
			expect(preparePagination(context)).to.deep.equal(context);
		});
	});

	describe('#deleteNewsHistory', () => {
		it('should only work if given an id', async () => {
			const context = {
				app,
				params: {
					query: { _id: { $in: [1, 2, 3] } },
				},
			};
			expect(await deleteNewsHistory(context)).to.deep.equal(context);
		});

		it('should remove all newsHistory items referencing the deleted news id', async () => {
			const newsId = new ObjectId();
			await newsHistoryModel.deleteMany({}).exec();
			await newsHistoryModel.create([
				{ title: 'foo', content: 'bar', parentId: newsId },
				{ title: 'baz', content: '420', parentId: newsId },
				{ title: 'test', content: 'bla' },
				{ title: 'title', content: 'content', parentId: new ObjectId() },
			]);

			expect(await newsHistoryModel.countDocuments()).to.equal(4);
			await deleteNewsHistory({ id: newsId.toString() });
			expect(await newsHistoryModel.countDocuments()).to.equal(2);

			// cleanup
			await newsHistoryModel.deleteMany({}).exec();
		});

		after(cleanup);
	});
});
