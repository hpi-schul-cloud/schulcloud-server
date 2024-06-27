import { faker } from '@faker-js/faker';
import { ContentElementType, LinkContentBody, RichTextContentBody } from '@modules/board';
import {
	CommonCartridgeImportOrganizationProps,
	CommonCartridgeImportResourceProps,
	CommonCartridgeResourceTypeV1P1,
} from '@modules/common-cartridge';
import { Test, TestingModule } from '@nestjs/testing';
import { InputFormat } from '@shared/domain/types';
import { CommonCartridgeImportMapper } from './common-cartridge-import.mapper';

describe('CommonCartridgeImportMapper', () => {
	let moduleRef: TestingModule;
	let sut: CommonCartridgeImportMapper;

	const setupOrganization = () => {
		const organization: CommonCartridgeImportOrganizationProps = {
			path: faker.string.uuid(),
			pathDepth: faker.number.int({ min: 0, max: 3 }),
			identifier: faker.string.uuid(),
			identifierRef: faker.string.uuid(),
			title: faker.lorem.words(3),
			isResource: true,
			isInlined: false,
			resourcePath: faker.system.filePath(),
			resourceType: faker.string.alpha(10),
		};

		return { organization };
	};

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

	describe('mapOrganizationToColumn', () => {
		describe('when organization is provided', () => {
			const setup = () => setupOrganization();

			it('should map organization to column', () => {
				const { organization } = setup();

				const result = sut.mapOrganizationToColumn(organization);

				expect(result).toEqual({
					title: organization.title,
				});
			});
		});
	});

	describe('mapOrganizationToCard', () => {
		describe('when organization is provided', () => {
			const setup = () => setupOrganization();

			it('should map organization to card', () => {
				const { organization } = setup();

				const result = sut.mapOrganizationToCard(organization);

				expect(result).toEqual({
					title: organization.title,
					height: 150,
				});
			});
		});

		describe('when organization is provided and withTitle is false', () => {
			const setup = () => setupOrganization();

			it('should set the title to an empty string', () => {
				const { organization } = setup();

				const result = sut.mapOrganizationToCard(organization, false);

				expect(result).toEqual({
					title: '',
					height: 150,
				});
			});
		});
	});

	// AI next 17 lines
	describe('mapOrganizationToTextElement', () => {
		describe('when organization is provided', () => {
			const setup = () => setupOrganization();

			it('should map organization to text element', () => {
				const { organization } = setup();

				const result = sut.mapOrganizationToTextElement(organization);

				expect(result).toBeInstanceOf(RichTextContentBody);
				expect(result).toEqual<RichTextContentBody>({
					text: `<b>${organization.title}</b>`,
					inputFormat: InputFormat.RICH_TEXT_CK5_SIMPLE,
				});
			});
		});
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
