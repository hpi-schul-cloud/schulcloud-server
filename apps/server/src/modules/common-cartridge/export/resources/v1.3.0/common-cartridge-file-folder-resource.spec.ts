import { streamToString } from '@modules/common-cartridge/testing/common-cartridge-testing.utils';
import { Readable, Stream } from 'stream';
import { createCommonCartridgeFileFolderResourcePropsV130 } from '../../../testing/common-cartridge-resource-props.factory';
import {
	CommonCartridgeElementType,
	CommonCartridgeResourceType,
	CommonCartridgeVersion,
} from '../../common-cartridge.enums';
import { ElementTypeNotSupportedLoggableException } from '../../errors';
import { CommonCartridgeFileFolderResourceV130 } from './common-cartridge-file-folder-resource';

describe(CommonCartridgeFileFolderResourceV130.name, () => {
	const setup = async () => {
		const props = createCommonCartridgeFileFolderResourcePropsV130();

		const expected = await streamToString(props.files[0].file);
		props.files = [{ file: Readable.from(expected), fileName: props.files[0].fileName }];

		const sut = new CommonCartridgeFileFolderResourceV130(props);

		return { sut, props, expected };
	};

	describe('getSupportedVersion', () => {
		it('should return the supported version', async () => {
			const { sut } = await setup();

			const result = sut.getSupportedVersion();

			expect(result).toBe(CommonCartridgeVersion.V_1_3_0);
		});
	});

	describe('getFileContent', () => {
		it('should return the file path', async () => {
			const { sut, props } = await setup();

			const result = sut.getFileContent();

			expect(result).toHaveLength(1);
			expect(result[0].path).toBe(`${props.folder}/${props.files[0].fileName}`);
		});

		it('should return the file stream', async () => {
			const { sut, expected } = await setup();

			const result = sut.getFileContent();

			expect(result).toHaveLength(1);

			const content = await streamToString(result[0].content as Stream);
			expect(content).toBe(expected);
		});
	});

	describe('getManifestXmlObject', () => {
		describe('when the element type is RESOURCE', () => {
			it('should return the manifest resource xml object', async () => {
				const { sut, props } = await setup();

				const result = sut.getManifestXmlObject(CommonCartridgeElementType.RESOURCE);

				expect(result).toEqual({
					$: {
						identifier: props.identifier,
						type: CommonCartridgeResourceType.WEB_CONTENT,
					},
					file: [
						{
							$: {
								href: sut.getFileContent()[0].path,
							},
						},
					],
				});
			});
		});

		describe('when the element type is ORGANIZATION', () => {
			it('should return the manifest organization xml object', async () => {
				const { sut, props } = await setup();

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
			it('should throw an error', async () => {
				const { sut } = await setup();

				expect(() => sut.getManifestXmlObject(CommonCartridgeElementType.METADATA)).toThrow(
					ElementTypeNotSupportedLoggableException
				);
			});
		});
	});
});
