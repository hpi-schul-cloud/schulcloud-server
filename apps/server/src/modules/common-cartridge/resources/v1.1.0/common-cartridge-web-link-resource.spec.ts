import { faker } from '@faker-js/faker';
import { readFile } from 'fs/promises';
import { CommonCartridgeResourceType, CommonCartridgeVersion } from '../../common-cartridge.enums';
import {
	CommonCartridgeWebLinkResourcePropsV110,
	CommonCartridgeWebLinkResourceV110,
} from './common-cartridge-web-link-resource';

describe('CommonCartridgeWebLinkResourceV110', () => {
	const setup = () => {
		const props: CommonCartridgeWebLinkResourcePropsV110 = {
			type: CommonCartridgeResourceType.WEB_LINK,
			version: CommonCartridgeVersion.V_1_1_0,
			identifier: faker.string.uuid(),
			folder: faker.string.uuid(),
			title: 'Title',
			url: 'http://www.example.tld',
			target: '_self',
			windowFeatures: 'width=100;height=100;',
		};
		const sut = new CommonCartridgeWebLinkResourceV110(props);

		return { sut, props };
	};

	describe('canInline', () => {
		describe('when using Common Cartridge version 1.1.0', () => {
			it('should return false', () => {
				const { sut } = setup();
				const result = sut.canInline();

				expect(result).toBe(false);
			});
		});
	});

	describe('getFilePath', () => {
		describe('when using Common Cartridge version 1.1.0', () => {
			it('should return the constructed file path', () => {
				const { sut, props } = setup();
				const result = sut.getFilePath();

				expect(result).toBe(`${props.folder}/${props.identifier}.xml`);
			});
		});
	});

	describe('getFileContent', () => {
		it('should contain correct XML', async () => {
			const { sut } = setup();
			const expected = await readFile('./apps/server/test/assets/common-cartridge/v1.1.0/weblink.xml', 'utf8');
			const result = sut.getFileContent();

			expect(result).toEqual(expected);
		});
	});

	describe('getSupportedVersion', () => {
		describe('when using Common Cartridge version 1.1.0', () => {
			it('should return the supported version', () => {
				const { sut } = setup();
				const result = sut.getSupportedVersion();

				expect(result).toBe(CommonCartridgeVersion.V_1_1_0);
			});
		});
	});

	describe('getManifestXmlObject', () => {
		describe('when using Common Cartridge version 1.1.0', () => {
			it('should return the manifest XML object', () => {
				const { sut, props } = setup();
				const result = sut.getManifestXmlObject();

				expect(result).toEqual({
					$: {
						identifier: props.identifier,
						type: 'imswl_xmlv1p1',
					},
					file: {
						$: {
							href: sut.getFilePath(),
						},
					},
				});
			});
		});
	});
});
