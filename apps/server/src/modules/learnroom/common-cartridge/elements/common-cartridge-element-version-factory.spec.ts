import { InternalServerErrorException } from '@nestjs/common';
import { CommonCartridgeVersion } from '../common-cartridge.enums';
import { CommonCartridgeElementVersionFactory } from './common-cartridge-element-version-factory';
import { CommonCartridgeElementFactoryV110 } from './v1.1.0/common-cartridge-element-factory';
import { CommonCartridgeElementFactoryV130 } from './v1.3.0/common-cartridge-element-factory';

describe('CommonCartridgeElementVersionFactory', () => {
	describe('createFactory', () => {
		describe('when versions is supported', () => {
			it('should return v1.1.0 factory', () => {
				const result = CommonCartridgeElementVersionFactory.createFactory(CommonCartridgeVersion.V_1_1_0);

				expect(result).toBeDefined();
				expect(result).toBeInstanceOf(CommonCartridgeElementFactoryV110);
			});

			it('should return v1.3.0 factory', () => {
				const result = CommonCartridgeElementVersionFactory.createFactory(CommonCartridgeVersion.V_1_3_0);

				expect(result).toBeDefined();
				expect(result).toBeInstanceOf(CommonCartridgeElementFactoryV130);
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
					expect(() => CommonCartridgeElementVersionFactory.createFactory(version)).toThrow(
						InternalServerErrorException
					);
				});
			});
		});
	});
});
