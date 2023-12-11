import { InternalServerErrorException } from '@nestjs/common';
import { CommonCartridgeVersion } from '../common-cartridge.enums';
import { CommonCartridgeResourceVersionFactory } from './common-cartridge-resource-version-factory';
import { CommonCartridgeResourceFactoryV110 } from './v1.1.0/common-cartridge-resource-factory';
import { CommonCartridgeResourceFactoryV130 } from './v1.3.0/common-cartridge-resource-factory';

describe('CommonCartridgeResourceVersionFactory', () => {
	describe('createFactory', () => {
		describe('when versions is supported', () => {
			it('should return v1.1.0 factory', () => {
				const result = CommonCartridgeResourceVersionFactory.createFactory(CommonCartridgeVersion.V_1_1_0);

				expect(result).toBeDefined();
				expect(result).toBeInstanceOf(CommonCartridgeResourceFactoryV110);
			});

			it('should return v1.3.0 factory', () => {
				const result = CommonCartridgeResourceVersionFactory.createFactory(CommonCartridgeVersion.V_1_3_0);

				expect(result).toBeDefined();
				expect(result).toBeInstanceOf(CommonCartridgeResourceFactoryV130);
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
					expect(() => CommonCartridgeResourceVersionFactory.createFactory(version)).toThrow(
						InternalServerErrorException
					);
				});
			});
		});
	});
});
