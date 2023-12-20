import { InternalServerErrorException } from '@nestjs/common';
import {
	CommonCartridgeIntendedUseType,
	CommonCartridgeResourceType,
	CommonCartridgeVersion,
} from '../../common-cartridge.enums';
import {
	CommonCartridgeManifestResourcePropsV130,
	CommonCartridgeManifestResourceV130,
} from './common-cartridge-manifest-resource';
import { CommonCartridgeResourceFactoryV130 } from './common-cartridge-resource-factory';
import {
	CommonCartridgeWebContentResourcePropsV130,
	CommonCartridgeWebContentResourceV130,
} from './common-cartridge-web-content-resource';
import {
	CommonCartridgeWebLinkResourcePropsV130,
	CommonCartridgeWebLinkResourceV130,
} from './common-cartridge-web-link-resource';

describe('CommonCartridgeResourceFactoryV130', () => {
	describe('createResource', () => {
		describe('when creating resources from props', () => {
			it('should return manifest resource', () => {
				const result = CommonCartridgeResourceFactoryV130.createResource({
					type: CommonCartridgeResourceType.MANIFEST,
					version: CommonCartridgeVersion.V_1_3_0,
				} as CommonCartridgeManifestResourcePropsV130);

				expect(result).toBeInstanceOf(CommonCartridgeManifestResourceV130);
			});

			it('shoul return web content resource', () => {
				const result = CommonCartridgeResourceFactoryV130.createResource({
					type: CommonCartridgeResourceType.WEB_CONTENT,
					version: CommonCartridgeVersion.V_1_3_0,
					intendedUse: CommonCartridgeIntendedUseType.UNSPECIFIED,
				} as CommonCartridgeWebContentResourcePropsV130);

				expect(result).toBeInstanceOf(CommonCartridgeWebContentResourceV130);
			});

			it('shoul return web link resource', () => {
				const result = CommonCartridgeResourceFactoryV130.createResource({
					type: CommonCartridgeResourceType.WEB_LINK,
					version: CommonCartridgeVersion.V_1_3_0,
				} as CommonCartridgeWebLinkResourcePropsV130);

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
