import { faker } from '@faker-js/faker';
import { InternalServerErrorException } from '@nestjs/common';
import {
	CommonCartridgeIntendedUseType,
	CommonCartridgeResourceType,
	CommonCartridgeVersion,
} from '../../common-cartridge.enums';
import {
	CommonCartridgeWebContentResourcePropsV130,
	CommonCartridgeWebContentResourceV130,
} from './common-cartridge-web-content-resource';

describe('CommonCartridgeWebContentResourceV130', () => {
	const setup = () => {
		const props: CommonCartridgeWebContentResourcePropsV130 = {
			type: CommonCartridgeResourceType.WEB_CONTENT,
			version: CommonCartridgeVersion.V_1_3_0,
			folder: faker.string.uuid(),
			identifier: faker.string.uuid(),
			title: faker.lorem.words(),
			html: faker.lorem.words(),
			intendedUse: CommonCartridgeIntendedUseType.UNSPECIFIED,
		};
		const sut = new CommonCartridgeWebContentResourceV130(props);

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

				expect(result).toBe(`${props.folder}/${props.identifier}.html`);
			});
		});
	});

	describe('getFileContent', () => {
		describe('when using Common Cartridge version 1.3.0', () => {
			it('should return the HTML', () => {
				const { sut, props } = setup();
				const result = sut.getFileContent();

				expect(result).toBe(props.html);
			});
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

		describe('when using not supported Common Cartridge version', () => {
			it('should throw error', () => {
				expect(
					() =>
						new CommonCartridgeWebContentResourceV130({
							type: CommonCartridgeResourceType.WEB_CONTENT,
							version: CommonCartridgeVersion.V_1_1_0,
						} as CommonCartridgeWebContentResourcePropsV130)
				).toThrow(InternalServerErrorException);
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
						type: props.type,
						intendeduse: props.intendedUse,
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
