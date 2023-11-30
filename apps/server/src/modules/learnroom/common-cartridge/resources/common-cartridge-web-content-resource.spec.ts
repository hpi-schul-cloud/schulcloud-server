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
		folder: 'https://example.com/link',
		title: 'Web Link',
		html: 'html tages for testing',
	};
	const webContentResource = new CommonCartridgeWebContentResource(props);

	describe('canInline', () => {
		describe('when the return value of the method is called', () => {
			it('should return false regardless of the common cartridge version', () => {
				expect(webContentResource.canInline()).toBe(false);
			});
		});
	});

	describe('getFilePath', () => {
		describe('when the return value of the method is called', () => {
			it('should return the file path regardless of the common cartridge version', () => {
				const filePath = webContentResource.getFilePath();
				expect(filePath).toBe(`${props.folder}/${props.identifier}.html`);
			});
		});
	});

	describe('getFileContent', () => {
		describe('when the return value of the method is called', () => {
			it('should return html content regardless of the common cartridge version', () => {
				const content = webContentResource.getFileContent();
				expect(content).toContain(props.html);
			});
		});
	});

	describe('getManifestXml', () => {
		describe('when the return value of the method is called', () => {
			it('should return manifest xml content regardless of the common cartridge version', () => {
				const transformed = webContentResource.getManifestXml();
				expect(transformed).toEqual({
					$: {
						identifier: props.identifier,
						type: props.type,
						intendeduse: 'unspecified',
					},
					file: {
						$: {
							href: props.folder,
						},
					},
				});
			});
		});
	});
});
