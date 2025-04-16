import { Test, TestingModule } from '@nestjs/testing';
import { CommonCartridgeImportMapper } from './common-cartridge-import.mapper';
import { CommonCartridgeResourceTypeV1P1 } from '../import/common-cartridge-import.enums';

describe('CommonCartridgeImportMapper', () => {
	let module: TestingModule;
	let sut: CommonCartridgeImportMapper;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [CommonCartridgeImportMapper],
		}).compile();

		sut = module.get(CommonCartridgeImportMapper);
	});

	afterAll(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(sut).toBeDefined();
	});

	describe('mapResourceTypeToContentElementType', () => {
		describe('when resourceType is provided', () => {
			it('should return undefined', () => {
				const result = sut.mapResourceTypeToContentElementType(undefined);

				expect(result).toBeUndefined();
			});

			it('should return link', () => {
				const result = sut.mapResourceTypeToContentElementType(CommonCartridgeResourceTypeV1P1.WEB_LINK);

				expect(result).toEqual('link');
			});

			it('should return rich text', () => {
				const result = sut.mapResourceTypeToContentElementType(CommonCartridgeResourceTypeV1P1.WEB_CONTENT);

				expect(result).toEqual('richText');
			});
		});
	});
});
