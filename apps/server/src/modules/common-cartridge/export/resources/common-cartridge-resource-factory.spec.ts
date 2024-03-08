import { InternalServerErrorException } from '@nestjs/common';
import {
	createCommonCartridgeWebContentResourcePropsV110,
	createCommonCartridgeWebContentResourcePropsV130,
} from '../../testing/common-cartridge-resource-props.factory';
import { CommonCartridgeResourceType, CommonCartridgeVersion } from '../common-cartridge.enums';
import { CommonCartridgeResourceFactory } from './common-cartridge-resource-factory';
import { CommonCartridgeWebContentResourcePropsV110, CommonCartridgeWebContentResourceV110 } from './v1.1.0';
import { CommonCartridgeWebContentResourceV130 } from './v1.3.0';

describe('CommonCartridgeResourceVersion', () => {
	describe('createResource', () => {
		describe('when Common Cartridge version is supported', () => {
			it('should return v1.1.0 resource', () => {
				const props = createCommonCartridgeWebContentResourcePropsV110();

				const result = CommonCartridgeResourceFactory.createResource(props);

				expect(result).toBeInstanceOf(CommonCartridgeWebContentResourceV110);
			});

			it('should return v1.3.0 resource', () => {
				const props = createCommonCartridgeWebContentResourcePropsV130();

				const result = CommonCartridgeResourceFactory.createResource(props);

				expect(result).toBeInstanceOf(CommonCartridgeWebContentResourceV130);
			});
		});

		describe('when versions is not supported', () => {
			const notSupportedVersions = [
				CommonCartridgeVersion.V_1_0_0,
				CommonCartridgeVersion.V_1_2_0,
				CommonCartridgeVersion.V_1_4_0,
			];

			it('should throw InternalServerErrorException', () => {
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
