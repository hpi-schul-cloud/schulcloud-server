import { CommonCartridgeResourceType, CommonCartridgeVersion } from '../common-cartridge.enums';
import {
	CommonCartridgeWebContentResource,
	CommonCartridgeWebContentResourceProps,
} from './common-cartridge-web-content-resource';

describe('CommonCartridgeWebContentResource', () => {
	const propsVersion1: CommonCartridgeWebContentResourceProps = {
		type: CommonCartridgeResourceType.WEB_CONTENT,
		version: CommonCartridgeVersion.V_1_1_0,
		identifier: 'web-link-v1',
		folder: 'https://example.com/link1',
		title: 'Web Link Version 1',
		html: 'html tages for testing version 1',
	};
	const propsVersion3: CommonCartridgeWebContentResourceProps = {
		type: CommonCartridgeResourceType.WEB_CONTENT,
		version: CommonCartridgeVersion.V_1_3_0,
		identifier: 'web-link-v3',
		folder: 'https://example.com/link3',
		title: 'Web Link Version 3',
		html: 'html tages for testing version 3',
	};

	const webContentResourceVersion1 = new CommonCartridgeWebContentResource(propsVersion1);
	const webContentResourceVersion3 = new CommonCartridgeWebContentResource(propsVersion3);

	describe('canInline', () => {
		describe('when common cartridge version 1.1', () => {
			it('should return false', () => {
				expect(webContentResourceVersion1.canInline()).toBe(false);
			});
		});

		describe('when common cartridge version 1.3', () => {
			it('should return false', () => {
				expect(webContentResourceVersion3.canInline()).toBe(false);
			});
		});
	});

	describe('getFilePath', () => {
		describe('when common cartridge version 1.1', () => {
			it('should return the file path regarding version 1.1', () => {
				const filePath = webContentResourceVersion1.getFilePath();
				expect(filePath).toBe(`${propsVersion1.folder}/${propsVersion1.identifier}.html`);
			});
		});

		describe('when common cartridge version 1.3', () => {
			it('should return the file path regarding version 1.3', () => {
				const filePath = webContentResourceVersion3.getFilePath();
				expect(filePath).toBe(`${propsVersion3.folder}/${propsVersion3.identifier}.html`);
			});
		});
	});

	describe('getFileContent', () => {
		describe('when common cartridge version 1.1', () => {
			it('should return XML content of common cartridge version 1.1', () => {
				const content = webContentResourceVersion1.getFileContent();
				expect(content).toContain(propsVersion1.html);
			});
		});

		describe('when common cartridge version 1.3', () => {
			it('should return XML content of common cartridge version 1.3', () => {
				const content = webContentResourceVersion3.getFileContent();
				expect(content).toContain(propsVersion3.html);
			});
		});
	});

	describe('getManifestXml', () => {
		describe('when common cartridge version 1.1', () => {
			it('should return manifest xml content regarding version 1.1', () => {
				const transformed = webContentResourceVersion1.getManifestXmlObject();
				expect(transformed).toStrictEqual({
					$: {
						identifier: propsVersion1.identifier,
						type: propsVersion1.type,
						intendeduse: 'unspecified',
					},
					file: {
						$: {
							href: propsVersion1.folder,
						},
					},
				});
			});
		});

		describe('when common cartridge version 1.3', () => {
			it('should return manifest xml content regarding version 1.3', () => {
				const transformed = webContentResourceVersion3.getManifestXmlObject();
				expect(transformed).toStrictEqual({
					$: {
						identifier: propsVersion3.identifier,
						type: propsVersion3.type,
						intendeduse: 'unspecified',
					},
					file: {
						$: {
							href: propsVersion3.folder,
						},
					},
				});
			});
		});
	});
});
