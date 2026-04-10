import { Readable, Stream } from 'stream';
import { createCommonCartridgeFileResourcePropsV110 } from '../../../testing/common-cartridge-resource-props.factory';
import {
	CommonCartridgeElementType,
	CommonCartridgeResourceType,
	CommonCartridgeVersion,
} from '../../common-cartridge.enums';
import { ElementTypeNotSupportedLoggableException } from '../../errors';
import { CommonCartridgeFileResourceV110 } from './common-cartridge-file-resource';
import { streamToString } from '@modules/common-cartridge/testing/common-cartridge-testing.utils';

describe(CommonCartridgeFileResourceV110.name, () => {
	const setup = async () => {
		const props = createCommonCartridgeFileResourcePropsV110();

		const expected = await streamToString(props.file);
		props.file = Readable.from(expected);

		const sut = new CommonCartridgeFileResourceV110(props);

		return { sut, props, expected };
	};

	describe('getSupportedVersion', () => {
		it('should return the supported version', async () => {
			const { sut } = await setup();

			const result = sut.getSupportedVersion();

			expect(result).toBe(CommonCartridgeVersion.V_1_1_0);
		});
	});

	describe('getFileContent', () => {
		it('should return the file stream', async () => {
			const { sut, expected } = await setup();

			const result = sut.getFileContent();
			const content = await streamToString(result.content as Stream);

			expect(content).toBe(expected);
		});

		it('should return the file path', async () => {
			const { sut, props } = await setup();

			const result = sut.getFileContent();

			expect(result.path).toBe(`${props.folder}/${props.fileName}`);
		});
	});

	describe('getManifestXmlObject', () => {
		describe('when the element type is RESOURCE', () => {
			it('should return the manifest resource xml object', async () => {
				const { sut, props } = await setup();

				const manifestXmlObject = sut.getManifestXmlObject(CommonCartridgeElementType.RESOURCE);

				expect(manifestXmlObject).toEqual({
					$: {
						identifier: props.identifier,
						type: CommonCartridgeResourceType.WEB_CONTENT,
					},
					file: {
						$: {
							href: sut.getFileContent().path,
						},
					},
				});
			});
		});

		describe('when the element type is ORGANIZATION', () => {
			it('should return the manifest organization xml object', async () => {
				const { sut, props } = await setup();

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
			it('should throw an error', async () => {
				const { sut } = await setup();

				expect(() => sut.getManifestXmlObject(CommonCartridgeElementType.MANIFEST)).toThrow(
					ElementTypeNotSupportedLoggableException
				);
			});
		});
	});
});
