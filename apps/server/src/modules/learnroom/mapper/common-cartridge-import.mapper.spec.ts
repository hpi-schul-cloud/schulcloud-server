import { faker } from '@faker-js/faker';
import { Test, TestingModule } from '@nestjs/testing';
import { ContentElementType } from '@modules/board/domain';
import { LinkContentBody, RichTextContentBody } from '@src/modules/board/controller/dto';
import { CommonCartridgeImportResourceProps, CommonCartridgeResourceTypeV1P1 } from '@src/modules/common-cartridge';
import { InputFormat } from '@shared/domain/types';
import { CommonCartridgeImportMapper } from './common-cartridge-import.mapper';

describe('CommonCartridgeImportMapper', () => {
	let moduleRef: TestingModule;
	let sut: CommonCartridgeImportMapper;

	// AI next 18 lines
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
				const result = sut.mapResourceTypeToContentElementType(undefined);

				expect(result).toBeUndefined();
			});

			it('should return link', () => {
				const result = sut.mapResourceTypeToContentElementType(CommonCartridgeResourceTypeV1P1.WEB_LINK);

				expect(result).toEqual(ContentElementType.LINK);
			});

			it('should return rich text', () => {
				const result = sut.mapResourceTypeToContentElementType(CommonCartridgeResourceTypeV1P1.WEB_CONTENT);

				expect(result).toEqual(ContentElementType.RICH_TEXT);
			});
		});
	});

	describe('mapResourceToContentElementBody', () => {
		describe('when known resource type is provided', () => {
			it('should return link content element body', () => {
				const resource: CommonCartridgeImportResourceProps = {
					type: CommonCartridgeResourceTypeV1P1.WEB_LINK,
					title: faker.lorem.words(3),
					url: faker.internet.url(),
				};

				const result = sut.mapResourceToContentElementBody(resource);

				expect(result).toBeInstanceOf(LinkContentBody);
				expect(result).toEqual<LinkContentBody>({
					title: resource.title,
					url: resource.url,
				});
			});

			it('should return rich text content element body', () => {
				const resource: CommonCartridgeImportResourceProps = {
					type: CommonCartridgeResourceTypeV1P1.WEB_CONTENT,
					title: faker.lorem.words(3),
					html: faker.lorem.paragraph(),
				};

				const result = sut.mapResourceToContentElementBody(resource);

				expect(result).toBeInstanceOf(RichTextContentBody);
				expect(result).toEqual<RichTextContentBody>({
					text: resource.html,
					inputFormat: InputFormat.RICH_TEXT_CK5_SIMPLE,
				});
			});
		});

		describe('when unknown resource type is provided', () => {
			it('should throw', () => {
				expect(() => sut.mapResourceToContentElementBody({ type: CommonCartridgeResourceTypeV1P1.UNKNOWN })).toThrow(
					'Resource type not supported'
				);
			});
		});
	});
});
