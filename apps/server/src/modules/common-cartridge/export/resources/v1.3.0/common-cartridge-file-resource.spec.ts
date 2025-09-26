import { createCommonCartridgeFileResourcePropsV130 } from '../../../testing/common-cartridge-resource-props.factory';
import {
	CommonCartridgeElementType,
	CommonCartridgeResourceType,
	CommonCartridgeVersion,
} from '../../common-cartridge.enums';
import { ElementTypeNotSupportedLoggableException } from '../../errors';
import { CommonCartridgeFileResourceV130 } from './common-cartridge-file-resource';

describe(CommonCartridgeFileResourceV130.name, () => {
	const setup = () => {
		const props = createCommonCartridgeFileResourcePropsV130();
		const sut = new CommonCartridgeFileResourceV130(props);

		return { sut, props };
	};

	describe('getSupportedVersion', () => {
		it('should return the supported version', () => {
			const { sut } = setup();

			const result = sut.getSupportedVersion();

			expect(result).toBe(CommonCartridgeVersion.V_1_3_0);
		});
	});

	describe('getFilePath', () => {
		it('should return the file path', () => {
			const { sut, props } = setup();

			const result = sut.getFilePath();

			expect(result).toBe(`${props.folder}/${props.fileName}`);
		});
	});

	describe('getFileContent', () => {
		it('should throw Error', () => {
			const { sut } = setup();

			expect(() => sut.getFileContent()).toThrow(new Error('getFileContent is not supported'));
		});
	});

	describe('getFileContent', () => {
		it('should return the file stream', () => {
			const { sut, props } = setup();

			const result = sut.getFileStream();

			expect(result).toBe(props.file);
		});
	});

	describe('getManifestXmlObject', () => {
		describe('when the element type is RESOURCE', () => {
			it('should return the manifest resource xml object', () => {
				const { sut, props } = setup();

				const result = sut.getManifestXmlObject(CommonCartridgeElementType.RESOURCE);

				expect(result).toEqual({
					$: {
						identifier: props.identifier,
						type: CommonCartridgeResourceType.WEB_CONTENT,
					},
					file: {
						$: {
							href: sut.getFilePath(),
						},
					},
				});
			});
		});

		describe('when the element type is ORGANIZATION', () => {
			it('should return the manifest organization xml object', () => {
				const { sut, props } = setup();

				const result = sut.getManifestXmlObject(CommonCartridgeElementType.ORGANIZATION);

				expect(result).toEqual({
					$: {
						identifier: expect.any(String),
						identifierref: props.identifier,
					},
					title: props.title,
				});
			});
		});

		describe('when the element type is not supported', () => {
			it('should throw an error', () => {
				const { sut } = setup();

				expect(() => sut.getManifestXmlObject(CommonCartridgeElementType.METADATA)).toThrow(
					ElementTypeNotSupportedLoggableException
				);
			});
		});
	});
});
