import { faker } from '@faker-js/faker';
import { readFile } from 'node:fs/promises';
import { CommonCartridgeResourceType, CommonCartridgeVersion } from '../../common-cartridge.enums';
import {
	CommonCartridgeWebLinkResourcePropsV130,
	CommonCartridgeWebLinkResourceV130,
} from './common-cartridge-web-link-resource';

describe('CommonCartridgeWebLinkResourceV130', () => {
	const setup = () => {
		const props: CommonCartridgeWebLinkResourcePropsV130 = {
			type: CommonCartridgeResourceType.WEB_LINK,
			version: CommonCartridgeVersion.V_1_3_0,
			identifier: faker.string.uuid(),
			folder: faker.string.uuid(),
			title: 'Title',
			url: 'http://www.example.tld',
			target: '_self',
			windowFeatures: 'width=100;height=100;', // FIXME: Is this a valid value?
		};
		const sut = new CommonCartridgeWebLinkResourceV130(props);

		return { sut, props };
	};

	describe('canInline', () => {
		describe('when using Common Cartridge version 1.3.0', () => {
			it('should return false', () => {
				const { sut } = setup();
				const result = sut.canInline();

				expect(result).toBe(false);
			});
		});
	});

	describe('getFilePath', () => {
		describe('when using Common Cartridge version 1.3.0', () => {
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
			const expected = await readFile('./apps/server/test/assets/common-cartridge/v1.3.0/weblink.xml', 'utf8');
			const result = sut.getFileContent();

			expect(result).toEqual(expected);
		});
	});

	describe('getSupportedVersion', () => {
		describe('when using Common Cartridge version 1.3.0', () => {
			it('should return the supported version', () => {
				const { sut } = setup();
				const result = sut.getSupportedVersion();

				expect(result).toBe(CommonCartridgeVersion.V_1_3_0);
			});
		});
	});

	describe('getManifestXmlObject', () => {
		describe('when using Common Cartridge version 1.3.0', () => {
			it('should return the manifest XML object', () => {
				const { sut, props } = setup();
				const result = sut.getManifestXmlObject();

				expect(result).toEqual({
					$: {
						identifier: props.identifier,
						type: 'imswl_xmlv1p3',
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
