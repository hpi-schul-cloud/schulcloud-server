import { InternalServerErrorException } from '@nestjs/common';
import { readFile } from 'fs/promises';
import { createCommonCartridgeManifestResourcePropsV130 } from '../../../testing/common-cartridge-resource-props.factory';
import {
	CommonCartridgeElementType,
	CommonCartridgeIntendedUseType,
	CommonCartridgeResourceType,
	CommonCartridgeVersion,
} from '../../common-cartridge.enums';
import { CommonCartridgeElementFactory } from '../../elements/common-cartridge-element-factory';
import { CommonCartridgeElementFactoryV130 } from '../../elements/v1.3.0';
import { ElementTypeNotSupportedLoggableException } from '../../errors';
import * as utils from '../../utils';
import { CommonCartridgeResourceFactory } from '../common-cartridge-resource-factory';
import { CommonCartridgeManifestResourceV130 } from './common-cartridge-manifest-resource';

describe('CommonCartridgeManifestResourceV130', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('getFilePath', () => {
		describe('when using Common Cartridge version 1.3.0', () => {
			const setup = () => {
				const props = createCommonCartridgeManifestResourcePropsV130();
				const sut = new CommonCartridgeManifestResourceV130(props);

				return { sut };
			};

			it('should return constructed file path', () => {
				const { sut } = setup();

				const result = sut.getFilePath();

				expect(result).toBe('imsmanifest.xml');
			});
		});
	});

	describe('getFileContent', () => {
		describe('when using Common Cartridge version 1.3.0', () => {
			const setup = () => {
				const resource1 = CommonCartridgeResourceFactory.createResource({
					type: CommonCartridgeResourceType.WEB_CONTENT,
					version: CommonCartridgeVersion.V_1_3_0,
					title: 'Title 1',
					identifier: 'r1',
					folder: 'o1',
					html: '<p>HTML</p>',
					intendedUse: CommonCartridgeIntendedUseType.UNSPECIFIED,
				});
				const resource2 = CommonCartridgeResourceFactory.createResource({
					type: CommonCartridgeResourceType.WEB_LINK,
					version: CommonCartridgeVersion.V_1_3_0,
					title: 'Title 2',
					identifier: 'r2',
					folder: 'o2',
					url: 'https://www.example.tld',
				});
				const organization1 = CommonCartridgeElementFactoryV130.createElement({
					type: CommonCartridgeElementType.ORGANIZATION,
					version: CommonCartridgeVersion.V_1_3_0,
					title: 'Title 1',
					identifier: 'o1',
					items: resource1,
				});
				const organization2 = CommonCartridgeElementFactory.createElement({
					type: CommonCartridgeElementType.ORGANIZATION,
					version: CommonCartridgeVersion.V_1_3_0,
					title: 'Title 2',
					identifier: 'o2',
					items: resource2,
				});
				const metadata = CommonCartridgeElementFactoryV130.createElement({
					type: CommonCartridgeElementType.METADATA,
					version: CommonCartridgeVersion.V_1_3_0,
					title: 'Common Cartridge Manifest',
					copyrightOwners: ['John Doe', 'Jane Doe'],
					creationDate: new Date('2023-01-01'),
				});
				const sut = new CommonCartridgeManifestResourceV130({
					type: CommonCartridgeResourceType.MANIFEST,
					version: CommonCartridgeVersion.V_1_3_0,
					identifier: 'm1',
					metadata,
					organizations: [organization1, organization2],
					resources: [resource1, resource2],
				});

				// we need this, otherwise the identifier will be random and we have to updated
				// the manifest.xml file which we will compare with the expected content in the test
				const mockValues = ['o1', 'o2'];
				jest.spyOn(utils, 'createIdentifier').mockImplementation(() => mockValues.shift() ?? '');

				return { sut };
			};

			it('should return constructed file content', async () => {
				const { sut } = setup();

				const expected = await readFile(
					'./apps/server/src/modules/common-cartridge/testing/assets/v1.3.0/manifest.xml',
					'utf-8'
				);
				const result = sut.getFileContent();

				expect(result).toEqual(expected);
			});
		});
	});

	describe('getSupportedVersion', () => {
		describe('when using Common Cartridge version 1.3.0', () => {
			const setup = () => {
				const props = createCommonCartridgeManifestResourcePropsV130();
				const sut = new CommonCartridgeManifestResourceV130(props);

				return { sut };
			};

			it('should return supported version', () => {
				const { sut } = setup();

				const result = sut.getSupportedVersion();

				expect(result).toBe(CommonCartridgeVersion.V_1_3_0);
			});
		});

		describe('when using not supported Common Cartridge version', () => {
			const notSupportedProps = createCommonCartridgeManifestResourcePropsV130();
			notSupportedProps.version = CommonCartridgeVersion.V_1_1_0;

			it('should throw error', () => {
				expect(() => new CommonCartridgeManifestResourceV130(notSupportedProps)).toThrow(InternalServerErrorException);
			});
		});
	});

	describe('getManifestXmlObject', () => {
		describe('when creating manifest xml object', () => {
			const setup = () => {
				const props = createCommonCartridgeManifestResourcePropsV130();
				const sut = new CommonCartridgeManifestResourceV130(props);

				return { sut };
			};

			it('should return manifest xml object', () => {
				const { sut } = setup();

				const result = sut.getManifestXmlObject(CommonCartridgeElementType.MANIFEST);

				expect(result).toStrictEqual({
					manifest: {
						$: expect.any(Object) as unknown,
						metadata: expect.any(Object) as unknown,
						organizations: expect.any(Object) as unknown,
						resources: expect.any(Object) as unknown,
					},
				});
			});
		});

		describe('when element type is not supported', () => {
			const setup = () => {
				const unknownElementType = 'unknown' as CommonCartridgeElementType;
				const props = createCommonCartridgeManifestResourcePropsV130();
				const sut = new CommonCartridgeManifestResourceV130(props);

				return { sut, unknownElementType };
			};

			it('should throw error', () => {
				const { sut, unknownElementType } = setup();

				expect(() => sut.getManifestXmlObject(unknownElementType)).toThrow(ElementTypeNotSupportedLoggableException);
			});
		});
	});
});
