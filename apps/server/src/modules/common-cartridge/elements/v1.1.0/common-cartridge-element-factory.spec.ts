import { InternalServerErrorException } from '@nestjs/common';
import { CommonCartridgeElementType, CommonCartridgeVersion } from '../../common-cartridge.enums';
import { CommonCartridgeElementFactoryV110 } from './common-cartridge-element-factory';
import {
	CommonCartridgeMetadataElementPropsV110,
	CommonCartridgeMetadataElementV110,
} from './common-cartridge-metadata-element';
import {
	CommonCartridgeOrganizationElementPropsV110,
	CommonCartridgeOrganizationElementV110,
} from './common-cartridge-organization-element';
import {
	CommonCartridgeOrganizationsWrapperElementPropsV110,
	CommonCartridgeOrganizationsWrapperElementV110,
} from './common-cartridge-organizations-wrapper-element';
import {
	CommonCartridgeResourcesWrapperElementPropsV110,
	CommonCartridgeResourcesWrapperElementV110,
} from './common-cartridge-resources-wrapper-element';

describe('CommonCartridgeElementFactoryV110', () => {
	describe('createElement', () => {
		describe('when creating elements from props', () => {
			const setup = (type: CommonCartridgeElementType) => {
				return {
					type,
					version: CommonCartridgeVersion.V_1_1_0,
				};
			};

			it('should return metadata element', () => {
				const props = setup(CommonCartridgeElementType.METADATA);
				const result = CommonCartridgeElementFactoryV110.createElement(
					props as CommonCartridgeMetadataElementPropsV110
				);

				expect(result).toBeInstanceOf(CommonCartridgeMetadataElementV110);
			});

			it('should return organization element', () => {
				const props = setup(CommonCartridgeElementType.ORGANIZATION);
				const result = CommonCartridgeElementFactoryV110.createElement(
					props as CommonCartridgeOrganizationElementPropsV110
				);

				expect(result).toBeInstanceOf(CommonCartridgeOrganizationElementV110);
			});

			it('should return organization wrapper element', () => {
				const props = setup(CommonCartridgeElementType.ORGANIZATIONS_WRAPPER);
				const result = CommonCartridgeElementFactoryV110.createElement(
					props as CommonCartridgeOrganizationsWrapperElementPropsV110
				);

				expect(result).toBeInstanceOf(CommonCartridgeOrganizationsWrapperElementV110);
			});

			it('should return resources wrapper element', () => {
				const props = setup(CommonCartridgeElementType.RESOURCES_WRAPPER);
				const result = CommonCartridgeElementFactoryV110.createElement(
					props as CommonCartridgeResourcesWrapperElementPropsV110
				);

				expect(result).toBeInstanceOf(CommonCartridgeResourcesWrapperElementV110);
			});
		});

		describe('when element type is not supported', () => {
			const setup = () => {
				return {
					type: 'not-supported' as CommonCartridgeElementType,
					version: CommonCartridgeVersion.V_1_1_0,
				};
			};

			it('should throw error', () => {
				expect(() =>
					CommonCartridgeElementFactoryV110.createElement(setup() as CommonCartridgeMetadataElementPropsV110)
				).toThrow(InternalServerErrorException);
			});
		});
	});
});
