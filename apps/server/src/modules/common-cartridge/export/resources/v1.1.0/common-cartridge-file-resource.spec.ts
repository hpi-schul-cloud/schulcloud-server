import { createCommonCartridgeFileResourcePropsV110 } from '../../../testing/common-cartridge-resource-props.factory';
import {
	CommonCartridgeElementType,
	CommonCartridgeResourceType,
	CommonCartridgeVersion,
} from '../../common-cartridge.enums';
import { ElementTypeNotSupportedLoggableException } from '../../errors';
import { CommonCartridgeFileResourceV110 } from './common-cartridge-file-resource';

describe(CommonCartridgeFileResourceV110.name, () => {
	const setup = () => {
		const props = createCommonCartridgeFileResourcePropsV110();
		const sut = new CommonCartridgeFileResourceV110(props);

		return { sut, props };
	};

	describe('getSupportedVersion', () => {
		it('should return the supported version', () => {
			const { sut } = setup();

			const result = sut.getSupportedVersion();

			expect(result).toBe(CommonCartridgeVersion.V_1_1_0);
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
		it('should return the file content', () => {
			const { sut, props } = setup();

			const result = sut.getFileContent();

			expect(result).toBe(props.fileContent);
		});
	});

	describe('getManifestXmlObject', () => {
		describe('when the element type is RESOURCE', () => {
			it('should return the manifest resource xml object', () => {
				const { sut, props } = setup();

				const manifestXmlObject = sut.getManifestXmlObject(CommonCartridgeElementType.RESOURCE);

				expect(manifestXmlObject).toEqual({
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

				const manifestXmlObject = sut.getManifestXmlObject(CommonCartridgeElementType.ORGANIZATION);

				expect(manifestXmlObject).toEqual({
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

				expect(() => sut.getManifestXmlObject(CommonCartridgeElementType.MANIFEST)).toThrow(
					ElementTypeNotSupportedLoggableException
				);
			});
		});
	});
});
