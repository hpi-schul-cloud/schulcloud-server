import { faker } from '@faker-js/faker';
import { Test, TestingModule } from '@nestjs/testing';
import { CardInitProps, ColumnInitProps, ContentElementType } from '@shared/domain/domainobject';
import { LinkContentBody } from '@src/modules/board/controller/dto';
import {
	CommonCartridgeImportResourceProps,
	CommonCartridgeOrganizationProps,
	CommonCartridgeResourceTypeV1P1,
} from '@src/modules/common-cartridge';
import { CommonCartridgeImportMapper } from './common-cartridge-import.mapper';

describe('CommonCartridgeImportMapper', () => {
	let moduleRef: TestingModule;
	let sut: CommonCartridgeImportMapper;

	const setupOrganization = () => {
		const organization: CommonCartridgeOrganizationProps = {
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

				expect(result).toEqual<ColumnInitProps>({
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

				expect(result).toEqual<CardInitProps>({
					title: organization.title,
					height: 150,
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
