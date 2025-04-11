import { Test, TestingModule } from '@nestjs/testing';
import { CommonCartridgeImportMapper } from './common-cartridge-import.mapper';
import { CommonCartridgeResourceTypeV1P1 } from './common-cartridge-import.enums';
import { ContentElementType } from '../generated';

describe('CommonCartridgeImportMapper', () => {
	let moduleRef: TestingModule;
	let sut: CommonCartridgeImportMapper;

	beforeAll(async () => {
		moduleRef = await Test.createTestingModule({
			providers: [CommonCartridgeImportMapper],
		}).compile();

		sut = moduleRef.get(CommonCartridgeImportMapper);
	});

	afterAll(async () => {
		await moduleRef.close();
	});

	it('should be defined', () => {
		expect(sut).toBeDefined();
	});

	describe('mapResourceTypeToContentElementType', () => {
		describe('when resourceType is provided', () => {
			it('should return undefined', () => {
				const result = CommonCartridgeImportMapper.mapResourceTypeToContentElementType(undefined);

				expect(result).toBeUndefined();
			});

			it('should return link', () => {
				const result = CommonCartridgeImportMapper.mapResourceTypeToContentElementType(
					CommonCartridgeResourceTypeV1P1.WEB_LINK
				);

				expect(result).toEqual(ContentElementType.LINK);
			});

			it('should return rich text', () => {
				const result = CommonCartridgeImportMapper.mapResourceTypeToContentElementType(
					CommonCartridgeResourceTypeV1P1.WEB_CONTENT
				);

				expect(result).toEqual(ContentElementType.RICH_TEXT);
			});
		});
	});
});
