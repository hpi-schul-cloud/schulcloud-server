import { CommonCartridgeResourceType, CommonCartridgeVersion } from '../common-cartridge.enums';
import {
	CommonCartridgeWebLinkResource,
	CommonCartridgeWebLinkResourceProps,
} from './common-cartridge-web-link-resource';

describe('CommonCartridgeWebLinkResource', () => {
	const propsOfV3: CommonCartridgeWebLinkResourceProps = {
		type: CommonCartridgeResourceType.WEB_LINK,
		version: CommonCartridgeVersion.V_1_3,
		identifier: 'web-link-v3',
		folder: 'https://example.com/linkv3',
		title: 'Web Link v3',
		url: 'https://example.com/linkv3',
	};
	const propsOfV1: CommonCartridgeWebLinkResourceProps = {
		type: CommonCartridgeResourceType.WEB_LINK,
		version: CommonCartridgeVersion.V_1_1,
		identifier: 'web-link-v1',
		folder: 'https://example.com/link1',
		title: 'Web Link v1',
		url: 'https://example.com/link1',
	};

	describe('canInline', () => {
		describe('when version is 1.3', () => {
			it('should return false', () => {
				const webLinkResource = new CommonCartridgeWebLinkResource(propsOfV3);
				expect(webLinkResource.canInline()).toBe(false);
			});
		});
		describe('when version is 1.1', () => {
			it('should return false', () => {
				const webLinkResource = new CommonCartridgeWebLinkResource(propsOfV1);
				expect(webLinkResource.canInline()).toBe(false);
			});
		});
	});

	describe('getFileContent', () => {
		describe('when version is 1.3', () => {
			it('should return XML content of common cartridge version 1.3', () => {
				const webLinkResource = new CommonCartridgeWebLinkResource(propsOfV3);
				const content = webLinkResource.getFileContent();

				expect(content).toContain('webLink');
				expect(content).toContain('http://www.w3.org/2001/XMLSchema-instance');
				expect(content).toContain('http://www.imsglobal.org/xsd/imsccv1p3/imswl_v1p3');
				expect(content).toContain('http://www.imsglobal.org/profile/cc/ccv1p3/ccv1p3_imswl_v1p3.xsd');
			});
		});

		describe('when version is 1.1', () => {
			it('should return XML content of common cartridge version 1.1', () => {
				const webLinkResource = new CommonCartridgeWebLinkResource(propsOfV1);
				const content = webLinkResource.getFileContent();

				expect(content).toContain('webLink');
				expect(content).toContain('http://www.w3.org/2001/XMLSchema-instance');
				expect(content).toContain('http://www.imsglobal.org/xsd/imsccv1p1/imswl_v1p1');
				expect(content).toContain(
					'https://www.imsglobal.org/sites/default/files/profile/cc/ccv1p1/ccv1p1_imswl_v1p1.xsd'
				);
			});
		});

		describe('when version is not supported', () => {
			it('should throw an error', () => {
				const webLinkResource = new CommonCartridgeWebLinkResource({
					...propsOfV1,
					version: 'xxx' as CommonCartridgeVersion,
				});

				expect(() => webLinkResource.getFileContent()).toThrowError('Version xxx is not supported');
			});
		});
	});

	describe('getManifestXml', () => {
		describe('when version is 1.3', () => {
			it('should return manifest XML of common cartridge version 1.3', () => {
				const webLinkResource = new CommonCartridgeWebLinkResource(propsOfV3);
				const transformed = webLinkResource.getManifestXml();

				expect(transformed).toEqual({
					$: {
						identifier: propsOfV3.identifier,
						type: propsOfV3.type,
					},
					file: {
						$: {
							href: propsOfV3.folder,
						},
					},
				});
			});
		});

		describe('when version is 1.1', () => {
			it('should return manifest XML of common cartridge version 1.1', () => {
				const webLinkResource = new CommonCartridgeWebLinkResource(propsOfV1);
				const transformed = webLinkResource.getManifestXml();

				expect(transformed).toEqual({
					$: {
						identifier: propsOfV1.identifier,
						type: propsOfV1.type,
					},
					file: {
						$: {
							href: propsOfV1.folder,
						},
					},
				});
			});
		});
	});
});
