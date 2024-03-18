import { InternalServerErrorException } from '@nestjs/common';
import {
	createCommonCartridgeManifestResourcePropsV130,
	createCommonCartridgeWebContentResourcePropsV130,
	createCommonCartridgeWeblinkResourcePropsV130,
} from '../../../testing/common-cartridge-resource-props.factory';
import { CommonCartridgeManifestResourceV130 } from './common-cartridge-manifest-resource';
import { CommonCartridgeResourceFactoryV130 } from './common-cartridge-resource-factory';
import { CommonCartridgeWebContentResourceV130 } from './common-cartridge-web-content-resource';
import {
	CommonCartridgeWebLinkResourcePropsV130,
	CommonCartridgeWebLinkResourceV130,
} from './common-cartridge-web-link-resource';

describe('CommonCartridgeResourceFactoryV130', () => {
	describe('createResource', () => {
		describe('when creating resources from props', () => {
			it('should return manifest resource', () => {
				const props = createCommonCartridgeManifestResourcePropsV130();

				const result = CommonCartridgeResourceFactoryV130.createResource(props);

				expect(result).toBeInstanceOf(CommonCartridgeManifestResourceV130);
			});

			it('should return web content resource', () => {
				const props = createCommonCartridgeWebContentResourcePropsV130();

				const result = CommonCartridgeResourceFactoryV130.createResource(props);

				expect(result).toBeInstanceOf(CommonCartridgeWebContentResourceV130);
			});

			it('should return web link resource', () => {
				const props = createCommonCartridgeWeblinkResourcePropsV130();

				const result = CommonCartridgeResourceFactoryV130.createResource(props);

				expect(result).toBeInstanceOf(CommonCartridgeWebLinkResourceV130);
			});
		});

		describe('when resource type is not supported', () => {
			it('should throw error', () => {
				expect(() =>
					CommonCartridgeResourceFactoryV130.createResource({} as CommonCartridgeWebLinkResourcePropsV130)
				).toThrow(InternalServerErrorException);
			});
		});
	});
});
