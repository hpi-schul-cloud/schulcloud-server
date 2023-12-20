import { InternalServerErrorException } from '@nestjs/common';
import {
	CommonCartridgeIntendedUseType,
	CommonCartridgeResourceType,
	CommonCartridgeVersion,
} from '../../common-cartridge.enums';
import {
	CommonCartridgeManifestResourcePropsV110,
	CommonCartridgeManifestResourceV110,
} from './common-cartridge-manifest-resource';
import { CommonCartridgeResourceFactoryV110 } from './common-cartridge-resource-factory';
import {
	CommonCartridgeWebContentResourcePropsV110,
	CommonCartridgeWebContentResourceV110,
} from './common-cartridge-web-content-resource';
import {
	CommonCartridgeWebLinkResourcePropsV110,
	CommonCartridgeWebLinkResourceV110,
} from './common-cartridge-web-link-resource';

describe('CommonCartridgeResourceFactoryV110', () => {
	describe('createResource', () => {
		describe('when creating resources from props', () => {
			it('should return manifest resource', () => {
				const result = CommonCartridgeResourceFactoryV110.createResource({
					type: CommonCartridgeResourceType.MANIFEST,
					version: CommonCartridgeVersion.V_1_1_0,
				} as CommonCartridgeManifestResourcePropsV110);

				expect(result).toBeInstanceOf(CommonCartridgeManifestResourceV110);
			});

			it('should return web content resource', () => {
				const result = CommonCartridgeResourceFactoryV110.createResource({
					type: CommonCartridgeResourceType.WEB_CONTENT,
					version: CommonCartridgeVersion.V_1_1_0,
					intendedUse: CommonCartridgeIntendedUseType.UNSPECIFIED,
				} as CommonCartridgeWebContentResourcePropsV110);

				expect(result).toBeInstanceOf(CommonCartridgeWebContentResourceV110);
			});

			it('should return web link resource', () => {
				const result = CommonCartridgeResourceFactoryV110.createResource({
					type: CommonCartridgeResourceType.WEB_LINK,
					version: CommonCartridgeVersion.V_1_1_0,
				} as CommonCartridgeWebLinkResourcePropsV110);

				expect(result).toBeInstanceOf(CommonCartridgeWebLinkResourceV110);
			});
		});

		describe('when resource type is not supported', () => {
			it('should throw error', () => {
				expect(() =>
					CommonCartridgeResourceFactoryV110.createResource({} as CommonCartridgeWebLinkResourcePropsV110)
				).toThrow(InternalServerErrorException);
			});
		});
	});
});
