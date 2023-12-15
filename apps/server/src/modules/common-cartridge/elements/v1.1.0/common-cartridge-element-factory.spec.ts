import { faker } from '@faker-js/faker/locale/af_ZA';
import { CommonCartridgeElementType, CommonCartridgeVersion } from '../../common-cartridge.enums';
import { CommonCartridgeElementFactoryV110 } from './common-cartridge-element-factory';
import { CommonCartridgeMetadataElementV110 } from './common-cartridge-metadata-element';
import { CommonCartridgeOrganizationElementV110 } from './common-cartridge-organization-element';
import { CommonCartridgeOrganizationsWrapperElementV110 } from './common-cartridge-organizations-wrapper-element';
import { CommonCartridgeResourcesWrapperElementV110 } from './common-cartridge-resources-wrapper-element';

describe('CommonCartridgeElementFactoryV110', () => {
	const setup = () => {
		const sut = new CommonCartridgeElementFactoryV110();
		return { sut };
	};

	describe('createElement', () => {
		describe('when creating elements from props', () => {
			it('should return metadata element', () => {
				const { sut } = setup();
				const result = sut.createElement({
					type: CommonCartridgeElementType.METADATA,
					version: CommonCartridgeVersion.V_1_1_0,
					title: faker.lorem.words(),
					creationDate: faker.date.past(),
					copyrightOwners: [faker.person.fullName(), faker.person.fullName()],
				});

				expect(result).toBeDefined();
				expect(result).toBeInstanceOf(CommonCartridgeMetadataElementV110);
			});

			it('should return organization element', () => {
				const { sut } = setup();
				const result = sut.createElement({
					type: CommonCartridgeElementType.ORGANIZATION,
					version: CommonCartridgeVersion.V_1_1_0,
					identifier: faker.string.uuid(),
					title: faker.lorem.words(),
					items: [],
				});

				expect(result).toBeDefined();
				expect(result).toBeInstanceOf(CommonCartridgeOrganizationElementV110);
			});

			it('should return organization wrapper element', () => {
				const { sut } = setup();
				const result = sut.createElement({
					type: CommonCartridgeElementType.ORGANIZATIONS_WRAPPER,
					version: CommonCartridgeVersion.V_1_1_0,
					items: [],
				});

				expect(result).toBeDefined();
				expect(result).toBeInstanceOf(CommonCartridgeOrganizationsWrapperElementV110);
			});

			it('should return resources wrapper element', () => {
				const { sut } = setup();
				const result = sut.createElement({
					type: CommonCartridgeElementType.RESOURCES_WRAPPER,
					version: CommonCartridgeVersion.V_1_1_0,
					items: [],
				});

				expect(result).toBeDefined();
				expect(result).toBeInstanceOf(CommonCartridgeResourcesWrapperElementV110);
			});
		});
	});
});
