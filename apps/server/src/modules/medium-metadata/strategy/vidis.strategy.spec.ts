import { MediaSourceDataFormat } from '@modules/media-source';
import { NotImplementedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { VidisStrategy } from './vidis.strategy';

describe(VidisStrategy.name, () => {
	let module: TestingModule;
	let strategy: VidisStrategy;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [VidisStrategy],
		}).compile();

		strategy = module.get(VidisStrategy);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('getMediaSourceFormat', () => {
		it('should return VIDIS as media source format', () => {
			expect(strategy.getMediaSourceFormat()).toBe(MediaSourceDataFormat.VIDIS);
		});
	});

	describe('getMediumMetadata', () => {
		describe('when not implemented', () => {
			it('should throw NotImplementedException', () => {
				const call = () => strategy.getMediumMetadata();
				expect(call).toThrow(NotImplementedException);
			});
		});
	});
});
