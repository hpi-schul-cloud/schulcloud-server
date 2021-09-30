import { Test, TestingModule } from '@nestjs/testing';
import { BsonConverter } from './bson.converter';

describe('BsonConverter', () => {
	let service: BsonConverter;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [BsonConverter],
		}).compile();

		service = module.get<BsonConverter>(BsonConverter);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});
});
