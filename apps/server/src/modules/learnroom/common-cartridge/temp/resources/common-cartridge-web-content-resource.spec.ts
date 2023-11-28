import { CommonCartridgeResourceType, CommonCartridgeVersion } from '../common-cartridge.enums';
import {
	CommonCartridgeWebContentResource,
	CommonCartridgeWebContentResourceProps,
} from './common-cartridge-web-content-resource';

describe('CommonCartridgeWebContentResource', () => {
	const props: CommonCartridgeWebContentResourceProps = {
		type: CommonCartridgeResourceType.WEB_CONTENT,
		version: CommonCartridgeVersion.V_1_3,
		identifier: 'web-link',
		href: 'https://example.com/link',
		title: 'Web Link',
		html: 'html tages for testing',
	};
	const webContentResource = new CommonCartridgeWebContentResource(props);
	describe('content', () => {
		it('should return html content regardless of common cartridge version', () => {
			const content = webContentResource.getFileContent();
			expect(content).toContain(props.html);
		});
	});
	describe('canInline', () => {
		it('check the return value of the method Can Inline ', () => {
			expect(webContentResource.canInline()).toBe(false);
		});
	});
	describe('transform', () => {
		it('should transform XML content regardless of common cartridge version', () => {
			const transformed = webContentResource.getManifestXml();
			expect(webContentResource.canInline()).toBe(false);
			expect(transformed).toEqual({
				$: {
					identifier: props.identifier,
					type: props.type,
					intendeduse: 'unspecified',
				},
				file: {
					$: {
						href: props.href,
					},
				},
			});
		});
	});
});
