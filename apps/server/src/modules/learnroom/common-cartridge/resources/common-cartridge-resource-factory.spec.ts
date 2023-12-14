import { InternalServerErrorException } from '@nestjs/common';
import { CommonCartridgeResourceType, CommonCartridgeVersion } from '../common-cartridge.enums';
import { CommonCartridgeResourceFactory } from './common-cartridge-resource-factory';
import {
	CommonCartridgeWebContentResourcePropsV110,
	CommonCartridgeWebContentResourceV110,
} from './v1.1.0/common-cartridge-web-content-resource';
import {
	CommonCartridgeWebContentResourcePropsV130,
	CommonCartridgeWebContentResourceV130,
} from './v1.3.0/common-cartridge-web-content-resource';

describe('CommonCartridgeResourceVersion', () => {
	describe('createResource', () => {
		describe('when Common Cartridge version is supported', () => {
			it('should return v1.1.0 resource', () => {
				const result = CommonCartridgeResourceFactory.createResource({
					version: CommonCartridgeVersion.V_1_1_0,
					type: CommonCartridgeResourceType.WEB_CONTENT,
				} as CommonCartridgeWebContentResourcePropsV110);

				expect(result).toBeInstanceOf(CommonCartridgeWebContentResourceV110);
			});

			it('should return v1.3.0 resource', () => {
				const result = CommonCartridgeResourceFactory.createResource({
					version: CommonCartridgeVersion.V_1_3_0,
					type: CommonCartridgeResourceType.WEB_CONTENT,
				} as CommonCartridgeWebContentResourcePropsV130);

				expect(result).toBeInstanceOf(CommonCartridgeWebContentResourceV130);
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
						CommonCartridgeResourceFactory.createResource({
							version,
							type: CommonCartridgeResourceType.WEB_CONTENT,
						} as CommonCartridgeWebContentResourcePropsV110)
					).toThrow(InternalServerErrorException);
				});
			});
		});
	});
});
