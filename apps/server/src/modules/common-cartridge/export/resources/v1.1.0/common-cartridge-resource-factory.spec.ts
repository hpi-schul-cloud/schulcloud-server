import {
	createCommonCartridgeManifestResourcePropsV110,
	createCommonCartridgeWebContentResourcePropsV110,
	createCommonCartridgeWeblinkResourcePropsV110,
} from '../../../testing/common-cartridge-resource-props.factory';
import { ResourceTypeNotSupportedLoggableException } from '../../errors';
import { CommonCartridgeManifestResourceV110 } from './common-cartridge-manifest-resource';
import { CommonCartridgeResourceFactoryV110 } from './common-cartridge-resource-factory';
import { CommonCartridgeWebContentResourceV110 } from './common-cartridge-web-content-resource';
import {
	CommonCartridgeWebLinkResourcePropsV110,
	CommonCartridgeWebLinkResourceV110,
} from './common-cartridge-web-link-resource';

describe('CommonCartridgeResourceFactoryV110', () => {
	describe('createResource', () => {
		describe('when creating resources from props', () => {
			it('should return manifest resource', () => {
				const props = createCommonCartridgeManifestResourcePropsV110();

				const result = CommonCartridgeResourceFactoryV110.createResource(props);

				expect(result).toBeInstanceOf(CommonCartridgeManifestResourceV110);
			});

			it('should return web content resource', () => {
				const props = createCommonCartridgeWebContentResourcePropsV110();

				const result = CommonCartridgeResourceFactoryV110.createResource(props);

				expect(result).toBeInstanceOf(CommonCartridgeWebContentResourceV110);
			});

			it('should return web link resource', () => {
				const props = createCommonCartridgeWeblinkResourcePropsV110();

				const result = CommonCartridgeResourceFactoryV110.createResource(props);

				expect(result).toBeInstanceOf(CommonCartridgeWebLinkResourceV110);
			});
		});

		describe('when resource type is not supported', () => {
			it('should throw ResourceTypeNotSupportedLoggableException', () => {
				expect(() =>
					CommonCartridgeResourceFactoryV110.createResource({} as CommonCartridgeWebLinkResourcePropsV110)
				).toThrow(ResourceTypeNotSupportedLoggableException);
			});
		});
	});
});
