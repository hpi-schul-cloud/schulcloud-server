import { faker } from '@faker-js/faker';
import {
	CommonCartridgeElementType,
	CommonCartridgeResourceType,
	CommonCartridgeVersion,
} from '../../common-cartridge.enums';
import { ElementTypeNotSupportedLoggableException } from '../../errors';
import {
	CommonCartridgeFileResourcePropsV130,
	CommonCartridgeFileResourceV130,
} from './common-cartridge-file-resource';

describe(CommonCartridgeFileResourceV130.name, () => {
	const setup = (props: Partial<CommonCartridgeFileResourcePropsV130> = {}) => {
		const defaultProps: CommonCartridgeFileResourcePropsV130 = {
			type: CommonCartridgeResourceType.FILE,
			version: CommonCartridgeVersion.V_1_3_0,
			identifier: faker.string.uuid(),
			folder: faker.system.directoryPath(),
			fileName: faker.system.fileName(),
			fileContent: Buffer.from(faker.lorem.sentence()),
			title: faker.lorem.word(),
		};
		const finalProps = { ...defaultProps, ...props };
		const sut = new CommonCartridgeFileResourceV130(finalProps);

		return { sut, props: finalProps };
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
