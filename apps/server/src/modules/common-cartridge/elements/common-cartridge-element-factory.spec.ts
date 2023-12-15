import { InternalServerErrorException } from '@nestjs/common';
import { CommonCartridgeElementType, CommonCartridgeVersion } from '../common-cartridge.enums';
import { CommonCartridgeElementFactory } from './common-cartridge-element-factory';
import {
	CommonCartridgeMetadataElementPropsV110,
	CommonCartridgeMetadataElementV110,
} from './v1.1.0/common-cartridge-metadata-element';
import {
	CommonCartridgeMetadataElementPropsV130,
	CommonCartridgeMetadataElementV130,
} from './v1.3.0/common-cartridge-metadata-element';

describe('CommonCartridgeElementFactory', () => {
	describe('createElement', () => {
		describe('when Common Cartridge versions is supported', () => {
			it('should return v1.1.0 element', () => {
				const result = CommonCartridgeElementFactory.createElement({
					version: CommonCartridgeVersion.V_1_1_0,
					type: CommonCartridgeElementType.METADATA,
				} as CommonCartridgeMetadataElementPropsV110);

				expect(result).toBeDefined();
				expect(result).toBeInstanceOf(CommonCartridgeMetadataElementV110);
			});

			it('should return v1.3.0 element', () => {
				const result = CommonCartridgeElementFactory.createElement({
					version: CommonCartridgeVersion.V_1_3_0,
					type: CommonCartridgeElementType.METADATA,
				} as CommonCartridgeMetadataElementPropsV130);

				expect(result).toBeDefined();
				expect(result).toBeInstanceOf(CommonCartridgeMetadataElementV130);
			});
		});

		describe('when versions is not supported', () => {
			it('should throw InternalServerErrorException', () => {
				const notSupportedVersions = [
					CommonCartridgeVersion.V_1_0_0,
					CommonCartridgeVersion.V_1_2_0,
					CommonCartridgeVersion.V_1_4_0,
				];

				notSupportedVersions.forEach((version) => {
					expect(() =>
						CommonCartridgeElementFactory.createElement({
							version,
							type: CommonCartridgeElementType.METADATA,
						} as CommonCartridgeMetadataElementPropsV110)
					).toThrow(InternalServerErrorException);
				});
			});
		});
	});
});
