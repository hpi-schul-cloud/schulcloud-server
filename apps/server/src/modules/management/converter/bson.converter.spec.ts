import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { BsonConverter } from './bson.converter';

describe('BsonConverter', () => {
	let converter: BsonConverter;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [BsonConverter],
		}).compile();

		converter = module.get(BsonConverter);
	});

	it('should be defined', () => {
		expect(converter).toBeDefined();
	});

	const bson = {
		_id: {
			$oid: '59a3c87aa2049554a93fec5c',
		},
		dueDate: {
			$date: '2018-05-28T08:00:00Z',
		},
	};

	const pojo = {
		_id: new ObjectId('59a3c87aa2049554a93fec5c'),
		dueDate: new Date('2018-05-28T08:00:00.000Z'),
	};

	describe('When serializing to bson', () => {
		it('should convert dates and object ids', () => {
			const result = converter.serialize([pojo]);
			expect(result).toEqual([bson]);
		});
	});

	describe('When deserialize from bson', () => {
		it('should convert dates and object ids', () => {
			const [result] = converter.deserialize([bson]) as {
				_id: ObjectId;
				dueDate: Date;
			}[];

			expect(result._id.toString()).toEqual(pojo._id.toString());
			expect(result.dueDate).toEqual(pojo.dueDate);
		});
	});
});
