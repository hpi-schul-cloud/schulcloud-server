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
			it('should return metadata element', () => {
				const result = CommonCartridgeElementFactoryV110.createElement({
					type: CommonCartridgeElementType.METADATA,
					version: CommonCartridgeVersion.V_1_1_0,
				} as CommonCartridgeMetadataElementPropsV110);

				expect(result).toBeInstanceOf(CommonCartridgeMetadataElementV110);
			});

			it('should return organization element', () => {
				const result = CommonCartridgeElementFactoryV110.createElement({
					type: CommonCartridgeElementType.ORGANIZATION,
					version: CommonCartridgeVersion.V_1_1_0,
				} as CommonCartridgeOrganizationElementPropsV110);

				expect(result).toBeInstanceOf(CommonCartridgeOrganizationElementV110);
			});

			it('should return organization wrapper element', () => {
				const result = CommonCartridgeElementFactoryV110.createElement({
					type: CommonCartridgeElementType.ORGANIZATIONS_WRAPPER,
					version: CommonCartridgeVersion.V_1_1_0,
				} as CommonCartridgeOrganizationsWrapperElementPropsV110);

				expect(result).toBeInstanceOf(CommonCartridgeOrganizationsWrapperElementV110);
			});

			it('should return resources wrapper element', () => {
				const result = CommonCartridgeElementFactoryV110.createElement({
					type: CommonCartridgeElementType.RESOURCES_WRAPPER,
					version: CommonCartridgeVersion.V_1_1_0,
				} as CommonCartridgeResourcesWrapperElementPropsV110);

				expect(result).toBeInstanceOf(CommonCartridgeResourcesWrapperElementV110);
			});
		});

		describe('when element type is not supported', () => {
			it('should throw error', () => {
				expect(() =>
					CommonCartridgeElementFactoryV110.createElement({
						type: 'not-supported' as CommonCartridgeElementType,
						version: CommonCartridgeVersion.V_1_1_0,
					} as CommonCartridgeMetadataElementPropsV110)
				).toThrow(InternalServerErrorException);
			});
		});
	});
});
