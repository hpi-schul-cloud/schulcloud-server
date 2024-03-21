import { faker } from '@faker-js/faker';
import { Test, TestingModule } from '@nestjs/testing';
import { CardInitProps, ColumnInitProps } from '@shared/domain/domainobject';
import { OrganizationProps } from '@src/modules/common-cartridge';
import { CommonCartridgeImportMapper } from './common-cartridge-import.mapper';

describe('CommonCartridgeImportMapper', () => {
	let moduleRef: TestingModule;
	let sut: CommonCartridgeImportMapper;

	const setupOrganization = () => {
		const organization: OrganizationProps = {
			path: faker.string.uuid(),
			pathDepth: faker.number.int({ min: 0, max: 3 }),
			identifier: faker.string.uuid(),
			identifierRef: faker.string.uuid(),
			title: faker.lorem.words(3),
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
});
