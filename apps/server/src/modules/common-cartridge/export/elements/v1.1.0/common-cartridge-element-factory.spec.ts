import {
	createCommonCartridgeMetadataElementPropsV110,
	createCommonCartridgeOrganizationElementPropsV110,
	createCommonCartridgeOrganizationsWrapperElementPropsV110,
	createCommonCartridgeResourcesWrapperElementPropsV110,
} from '../../../testing/common-cartridge-element-props.factory';
import { CommonCartridgeElementType } from '../../common-cartridge.enums';
import { ElementTypeNotSupportedLoggableException } from '../../errors';
import { CommonCartridgeElementFactoryV110 } from './common-cartridge-element-factory';
import { CommonCartridgeMetadataElementV110 } from './common-cartridge-metadata-element';
import { CommonCartridgeOrganizationElementV110 } from './common-cartridge-organization-element';
import { CommonCartridgeOrganizationsWrapperElementV110 } from './common-cartridge-organizations-wrapper-element';
import { CommonCartridgeResourcesWrapperElementV110 } from './common-cartridge-resources-wrapper-element';

describe('CommonCartridgeElementFactoryV110', () => {
	describe('createElement', () => {
		describe('when creating elements from props', () => {
			it('should return metadata element', () => {
				const props = createCommonCartridgeMetadataElementPropsV110();

				const result = CommonCartridgeElementFactoryV110.createElement(props);

				expect(result).toBeInstanceOf(CommonCartridgeMetadataElementV110);
			});

			it('should return organization element', () => {
				const props = createCommonCartridgeOrganizationElementPropsV110();

				const result = CommonCartridgeElementFactoryV110.createElement(props);

				expect(result).toBeInstanceOf(CommonCartridgeOrganizationElementV110);
			});

			it('should return organization wrapper element', () => {
				const props = createCommonCartridgeOrganizationsWrapperElementPropsV110();

				const result = CommonCartridgeElementFactoryV110.createElement(props);

				expect(result).toBeInstanceOf(CommonCartridgeOrganizationsWrapperElementV110);
			});

			it('should return resources wrapper element', () => {
				const props = createCommonCartridgeResourcesWrapperElementPropsV110();

				const result = CommonCartridgeElementFactoryV110.createElement(props);

				expect(result).toBeInstanceOf(CommonCartridgeResourcesWrapperElementV110);
			});
		});

		describe('when element type is not supported', () => {
			const notSupportedProps = createCommonCartridgeMetadataElementPropsV110();

			notSupportedProps.type = 'not-supported' as CommonCartridgeElementType.METADATA;

			it('should throw ElementTypeNotSupportedLoggableException', () => {
				expect(() => CommonCartridgeElementFactoryV110.createElement(notSupportedProps)).toThrow(
					ElementTypeNotSupportedLoggableException
				);
			});
		});
	});
});
