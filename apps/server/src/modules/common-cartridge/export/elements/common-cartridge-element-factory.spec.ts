import {
	createCommonCartridgeMetadataElementPropsV110,
	createCommonCartridgeMetadataElementPropsV130,
} from '../../testing/common-cartridge-element-props.factory';
import { CommonCartridgeElementType, CommonCartridgeVersion } from '../common-cartridge.enums';
import { VersionNotSupportedLoggableException } from '../errors';
import { CommonCartridgeElementFactory } from './common-cartridge-element-factory';
import { CommonCartridgeMetadataElementPropsV110, CommonCartridgeMetadataElementV110 } from './v1.1.0';
import { CommonCartridgeMetadataElementV130 } from './v1.3.0';

describe('CommonCartridgeElementFactory', () => {
	describe('createElement', () => {
		describe('when Common Cartridge versions is supported', () => {
			const propsV110 = createCommonCartridgeMetadataElementPropsV110();
			const propsV130 = createCommonCartridgeMetadataElementPropsV130();

			it('should return v1.1.0 element', () => {
				const result = CommonCartridgeElementFactory.createElement(propsV110);

				expect(result).toBeDefined();
				expect(result).toBeInstanceOf(CommonCartridgeMetadataElementV110);
			});

			it('should return v1.3.0 element', () => {
				const result = CommonCartridgeElementFactory.createElement(propsV130);

				expect(result).toBeDefined();
				expect(result).toBeInstanceOf(CommonCartridgeMetadataElementV130);
			});
		});

		describe('when versions is not supported', () => {
			const notSupportedVersions = [
				CommonCartridgeVersion.V_1_0_0,
				CommonCartridgeVersion.V_1_2_0,
				CommonCartridgeVersion.V_1_4_0,
			];

			it('should throw VersionNotSupportedLoggableException', () => {
				notSupportedVersions.forEach((version) => {
					expect(() =>
						CommonCartridgeElementFactory.createElement({
							version,
							type: CommonCartridgeElementType.METADATA,
						} as CommonCartridgeMetadataElementPropsV110)
					).toThrow(VersionNotSupportedLoggableException);
				});
			});
		});
	});
});
