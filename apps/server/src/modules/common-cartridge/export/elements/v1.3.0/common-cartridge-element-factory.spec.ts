import {
	createCommonCartridgeMetadataElementPropsV130,
	createCommonCartridgeOrganizationElementPropsV130,
	createCommonCartridgeOrganizationsWrapperElementPropsV130,
	createCommonCartridgeResourcesWrapperElementPropsV130,
} from '../../../testing/common-cartridge-element-props.factory';
import { CommonCartridgeElementType } from '../../common-cartridge.enums';
import { ElementTypeNotSupportedLoggableException } from '../../error';
import { CommonCartridgeElementFactoryV130 } from './common-cartridge-element-factory';
import { CommonCartridgeMetadataElementV130 } from './common-cartridge-metadata-element';
import { CommonCartridgeOrganizationElementV130 } from './common-cartridge-organization-element';
import { CommonCartridgeOrganizationsWrapperElementV130 } from './common-cartridge-organizations-wrapper-element';
import { CommonCartridgeResourcesWrapperElementV130 } from './common-cartridge-resources-wrapper-element';

describe('CommonCartridgeElementFactoryV130', () => {
	describe('createElement', () => {
		describe('when creating elements from props', () => {
			it('should return metadata element', () => {
				const props = createCommonCartridgeMetadataElementPropsV130();

				const result = CommonCartridgeElementFactoryV130.createElement(props);

				expect(result).toBeInstanceOf(CommonCartridgeMetadataElementV130);
			});

			it('should return organization element', () => {
				const props = createCommonCartridgeOrganizationElementPropsV130();

				const result = CommonCartridgeElementFactoryV130.createElement(props);

				expect(result).toBeInstanceOf(CommonCartridgeOrganizationElementV130);
			});

			it('should return organization wrapper element', () => {
				const props = createCommonCartridgeOrganizationsWrapperElementPropsV130();

				const result = CommonCartridgeElementFactoryV130.createElement(props);

				expect(result).toBeInstanceOf(CommonCartridgeOrganizationsWrapperElementV130);
			});

			it('should return resources wrapper element', () => {
				const props = createCommonCartridgeResourcesWrapperElementPropsV130();

				const result = CommonCartridgeElementFactoryV130.createElement(props);

				expect(result).toBeInstanceOf(CommonCartridgeResourcesWrapperElementV130);
			});
		});

		describe('when element type is not supported', () => {
			const notSupportedProps = createCommonCartridgeOrganizationsWrapperElementPropsV130();
			notSupportedProps.type = 'not-supported' as CommonCartridgeElementType.ORGANIZATIONS_WRAPPER;

			it('should throw ElementTypeNotSupportedLoggableException', () => {
				expect(() => CommonCartridgeElementFactoryV130.createElement(notSupportedProps)).toThrow(
					ElementTypeNotSupportedLoggableException
				);
			});
		});
	});
});
