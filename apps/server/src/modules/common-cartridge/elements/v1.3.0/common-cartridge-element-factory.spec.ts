import { InternalServerErrorException } from '@nestjs/common';
import { CommonCartridgeElementType, CommonCartridgeVersion } from '../../common-cartridge.enums';
import { CommonCartridgeOrganizationsWrapperElementPropsV110 } from '../v1.1.0/common-cartridge-organizations-wrapper-element';
import { CommonCartridgeElementFactoryV130 } from './common-cartridge-element-factory';
import {
	CommonCartridgeMetadataElementPropsV130,
	CommonCartridgeMetadataElementV130,
} from './common-cartridge-metadata-element';
import {
	CommonCartridgeOrganizationElementPropsV130,
	CommonCartridgeOrganizationElementV130,
} from './common-cartridge-organization-element';
import { CommonCartridgeOrganizationsWrapperElementV130 } from './common-cartridge-organizations-wrapper-element';
import {
	CommonCartridgeResourcesWrapperElementPropsV130,
	CommonCartridgeResourcesWrapperElementV130,
} from './common-cartridge-resources-wrapper-element';

describe('CommonCartridgeElementFactoryV130', () => {
	describe('createElement', () => {
		describe('when creating elements from props', () => {
			it('should return metadata element', () => {
				const result = CommonCartridgeElementFactoryV130.createElement({
					type: CommonCartridgeElementType.METADATA,
					version: CommonCartridgeVersion.V_1_3_0,
				} as CommonCartridgeMetadataElementPropsV130);

				expect(result).toBeInstanceOf(CommonCartridgeMetadataElementV130);
			});

			it('should return organization element', () => {
				const result = CommonCartridgeElementFactoryV130.createElement({
					type: CommonCartridgeElementType.ORGANIZATION,
					version: CommonCartridgeVersion.V_1_3_0,
				} as CommonCartridgeOrganizationElementPropsV130);

				expect(result).toBeInstanceOf(CommonCartridgeOrganizationElementV130);
			});

			it('should return organization wrapper element', () => {
				const result = CommonCartridgeElementFactoryV130.createElement({
					type: CommonCartridgeElementType.ORGANIZATIONS_WRAPPER,
					version: CommonCartridgeVersion.V_1_3_0,
				} as CommonCartridgeOrganizationsWrapperElementPropsV110);

				expect(result).toBeInstanceOf(CommonCartridgeOrganizationsWrapperElementV130);
			});

			it('should return resources wrapper element', () => {
				const result = CommonCartridgeElementFactoryV130.createElement({
					type: CommonCartridgeElementType.RESOURCES_WRAPPER,
					version: CommonCartridgeVersion.V_1_3_0,
				} as CommonCartridgeResourcesWrapperElementPropsV130);

				expect(result).toBeInstanceOf(CommonCartridgeResourcesWrapperElementV130);
			});
		});

		describe('when element type is not supported', () => {
			it('should throw error', () => {
				expect(() =>
					CommonCartridgeElementFactoryV130.createElement({
						type: 'not-supported' as CommonCartridgeElementType,
						version: CommonCartridgeVersion.V_1_3_0,
					} as CommonCartridgeResourcesWrapperElementPropsV130)
				).toThrow(InternalServerErrorException);
			});
		});
	});
});
