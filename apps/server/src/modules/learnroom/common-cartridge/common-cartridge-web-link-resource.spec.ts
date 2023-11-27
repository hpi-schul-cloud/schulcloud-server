import { Builder } from 'xml2js';
import { CommonCartridgeVersion, CommonCartridgeResourceType } from './common-cartridge-enums';
import {
	ICommonCartridgeWebLinkResourceProps,
	CommonCartridgeWebLinkResourceElement,
} from './common-cartridge-web-link-resource';

describe('CommonCartridgeWebLinkResourceElement', () => {
	const xmlBuilder = new Builder();
	const propsOfV3: ICommonCartridgeWebLinkResourceProps = {
		type: CommonCartridgeResourceType.WEB_LINK_V3,
		version: CommonCartridgeVersion.V_1_3_0,
		identifier: 'web-link-v3',
		href: 'https://example.com/linkv3',
		title: 'Web Link v3',
		url: 'https://example.com/linkv3',
	};
	const propsOfV1: ICommonCartridgeWebLinkResourceProps = {
		type: CommonCartridgeResourceType.WEB_LINK_V1,
		version: CommonCartridgeVersion.V_1_1_0,
		identifier: 'web-link-v1',
		href: 'https://example.com/link1',
		title: 'Web Link v1',
		url: 'https://example.com/link1',
	};

	describe('CommonCartridgeWebLinkResourceElement of version 3', () => {
		it('should return XML content of common cartridge version 3', () => {
			const webLinkResource = new CommonCartridgeWebLinkResourceElement(propsOfV3, xmlBuilder);
			const content = webLinkResource.content();
			const transformed = webLinkResource.transform();

			expect(content).toContain('webLink');
			expect(content).toContain('http://www.w3.org/2001/XMLSchema-instance');
			expect(content).toContain('http://www.imsglobal.org/xsd/imsccv1p3/imswl_v1p3');
			expect(content).toContain('http://www.imsglobal.org/profile/cc/ccv1p3/ccv1p3_imswl_v1p3.xsd');
			expect(transformed).toEqual({
				$: {
					identifier: propsOfV3.identifier,
					type: propsOfV3.type,
				},
				file: {
					$: {
						href: propsOfV3.href,
					},
				},
			});
			expect(webLinkResource.canInline()).toBe(false);
		});
	});

	describe('CommonCartridgeWebLinkResourceElement of version 1', () => {
		it('should return XML content of common cartridge version 1', () => {
			const webLinkResource = new CommonCartridgeWebLinkResourceElement(propsOfV1, xmlBuilder);
			const content = webLinkResource.content();
			const transformed = webLinkResource.transform();

			expect(content).toContain('webLink');
			expect(content).toContain('http://www.w3.org/2001/XMLSchema-instance');
			expect(content).toContain('http://www.imsglobal.org/xsd/imsccv1p1/imswl_v1p1');
			expect(content).toContain(
				'https://www.imsglobal.org/sites/default/files/profile/cc/ccv1p1/ccv1p1_imswl_v1p1.xsd'
			);
			expect(transformed).toEqual({
				$: {
					identifier: propsOfV1.identifier,
					type: propsOfV1.type,
				},
				file: {
					$: {
						href: propsOfV1.href,
					},
				},
			});
		});
	});
});
