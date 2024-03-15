import { InternalServerErrorException } from '@nestjs/common';
import { createCommonCartridgeWebContentResourcePropsV130 } from '../../../testing/common-cartridge-resource-props.factory';
import { CommonCartridgeVersion } from '../../common-cartridge.enums';
import { CommonCartridgeWebContentResourceV130 } from './common-cartridge-web-content-resource';

describe('CommonCartridgeWebContentResourceV130', () => {
	describe('canInline', () => {
		describe('when using Common Cartridge version 1.3.0', () => {
			const setup = () => {
				const props = createCommonCartridgeWebContentResourcePropsV130();
				const sut = new CommonCartridgeWebContentResourceV130(props);

				return { sut };
			};

			it('should return false', () => {
				const { sut } = setup();

				const result = sut.canInline();

				expect(result).toBe(false);
			});
		});
	});

	describe('getFilePath', () => {
		describe('when using Common Cartridge version 1.3.0', () => {
			const setup = () => {
				const props = createCommonCartridgeWebContentResourcePropsV130();
				const sut = new CommonCartridgeWebContentResourceV130(props);

				return { sut, props };
			};

			it('should return the constructed file path', () => {
				const { sut, props } = setup();

				const result = sut.getFilePath();

				expect(result).toBe(`${props.folder}/${props.identifier}.html`);
			});
		});
	});

	describe('getFileContent', () => {
		describe('when using Common Cartridge version 1.3.0', () => {
			const setup = () => {
				const props = createCommonCartridgeWebContentResourcePropsV130();
				const sut = new CommonCartridgeWebContentResourceV130(props);

				return { sut, props };
			};

			it('should return the HTML', () => {
				const { sut, props } = setup();

				const result = sut.getFileContent();

				expect(result).toBe(props.html);
			});
		});
	});

	describe('getSupportedVersion', () => {
		describe('when using Common Cartridge version 1.3.0', () => {
			const setup = () => {
				const props = createCommonCartridgeWebContentResourcePropsV130();
				const sut = new CommonCartridgeWebContentResourceV130(props);

				return { sut };
			};

			it('should return the supported version', () => {
				const { sut } = setup();

				const result = sut.getSupportedVersion();

				expect(result).toBe(CommonCartridgeVersion.V_1_3_0);
			});
		});

		describe('when using not supported Common Cartridge version', () => {
			const notSupportedProps = createCommonCartridgeWebContentResourcePropsV130();
			notSupportedProps.version = CommonCartridgeVersion.V_1_1_0;

			it('should throw error', () => {
				expect(() => new CommonCartridgeWebContentResourceV130(notSupportedProps)).toThrow(
					InternalServerErrorException
				);
			});
		});
	});

	describe('getManifestXmlObject', () => {
		describe('when using Common Cartridge version 1.3.0', () => {
			const setup = () => {
				const props = createCommonCartridgeWebContentResourcePropsV130();
				const sut = new CommonCartridgeWebContentResourceV130(props);

				return { sut, props };
			};

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
