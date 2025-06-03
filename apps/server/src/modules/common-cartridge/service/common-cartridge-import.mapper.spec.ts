/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { InputFormat } from '@shared/domain/types';
import { CommonCartridgeResourceTypeV1P1 } from '../import/common-cartridge-import.enums';
import {
	CommonCartridgeFileResourceProps,
	CommonCartridgeWebContentResourceProps,
	CommonCartridgeWebLinkResourceProps,
} from '../import/common-cartridge-import.types';
import { commonCartridgeOrganizationPropsFactory } from '../testing/common-cartridge-organization-props.factory';
import { CommonCartridgeImportMapper } from './common-cartridge-import.mapper';

describe('CommonCartridgeImportMapper', () => {
	let module: TestingModule;
	let sut: CommonCartridgeImportMapper;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [CommonCartridgeImportMapper],
		}).compile();

		sut = module.get(CommonCartridgeImportMapper);
	});

	afterAll(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(sut).toBeDefined();
	});

	describe('mapResourceTypeToContentElementType', () => {
		describe('when resourceType is provided', () => {
			it('should return undefined', () => {
				const result = sut.mapResourceTypeToContentElementType(undefined);

				expect(result).toBeUndefined();
			});

			it('should return link', () => {
				const result = sut.mapResourceTypeToContentElementType(CommonCartridgeResourceTypeV1P1.WEB_LINK);

				expect(result).toEqual('link');
			});

			it('should return rich text', () => {
				const result = sut.mapResourceTypeToContentElementType(CommonCartridgeResourceTypeV1P1.WEB_CONTENT);

				expect(result).toEqual('richText');
			});

			it('should return file', () => {
				const result = sut.mapResourceTypeToContentElementType(CommonCartridgeResourceTypeV1P1.FILE);

				expect(result).toEqual('file');
			});
		});
	});

	describe('mapResourceToContentBody', () => {
		describe('when resource is webLink', () => {
			const setup = () => {
				const resource: CommonCartridgeWebLinkResourceProps = {
					type: CommonCartridgeResourceTypeV1P1.WEB_LINK,
					url: 'https://example.com',
					title: '',
				};

				const cardElementProps = commonCartridgeOrganizationPropsFactory.build({
					resourcePath: 'path/to/resource',
					path: 'path/to/resource',
					pathDepth: 1,
					identifier: 'resource-id',
					title: 'Resource Title',
					isResource: true,
					isInlined: false,
					resourceType: 'webLink',
				});

				return { resource, cardElementProps };
			};

			it('should return link body', () => {
				const { resource, cardElementProps } = setup();

				const result = sut.mapResourceToContentBody(resource, cardElementProps, InputFormat.RICH_TEXT_CK4);

				expect(result).toEqual({
					type: 'link',
					content: {
						url: 'https://example.com',
						title: '',
						description: '',
						imageUrl: '',
						originalImageUrl: '',
					},
				});
			});
		});

		describe('when resource is webContent', () => {
			const setup = () => {
				const resource: CommonCartridgeWebContentResourceProps = {
					type: CommonCartridgeResourceTypeV1P1.WEB_CONTENT,
					html: '<p>Test</p>',
				};

				const cardElementProps = commonCartridgeOrganizationPropsFactory.build({
					resourcePath: 'path/to/resource.html',
					path: 'path/to/resource',
					pathDepth: 1,
					identifier: 'resource-id',
					title: 'Resource Title',
					isResource: true,
					isInlined: false,
					resourceType: 'webContent',
				});

				return { resource, cardElementProps };
			};

			it('should return rich text body', () => {
				const { resource, cardElementProps } = setup();

				const result = sut.mapResourceToContentBody(resource, cardElementProps, InputFormat.RICH_TEXT_CK4);

				expect(result).toEqual({
					type: 'richText',
					content: {
						inputFormat: 'richTextCk4',
						text: '<p>Test</p>',
					},
				});
			});
		});

		describe('when resource is webContent with non-html path', () => {
			const setup = () => {
				const resource: CommonCartridgeWebContentResourceProps = {
					type: CommonCartridgeResourceTypeV1P1.WEB_CONTENT,
					html: '<p>Test</p>',
				};

				const cardElementProps = commonCartridgeOrganizationPropsFactory.build({
					resourcePath: 'path/to/resource.jpg',
					path: 'path/to/resource',
					pathDepth: 1,
					identifier: 'resource-id',
					title: 'Resource Title',
					isResource: true,
					isInlined: false,
					resourceType: 'webContent',
				});

				return { resource, cardElementProps };
			};

			it('should return undefined for unknown resource type', () => {
				const { resource, cardElementProps } = setup();

				const result = sut.mapResourceToContentBody(resource, cardElementProps, InputFormat.RICH_TEXT_CK4);

				expect(result).toEqual(undefined);
			});
		});

		describe('when resource is a file', () => {
			const setup = () => {
				const resource: CommonCartridgeFileResourceProps = {
					type: CommonCartridgeResourceTypeV1P1.FILE,
					href: 'path/to/resource',
					fileName: 'resource.jpg',
					file: new File([''], 'resource.jpg'),
					description: 'Resource description',
				};
				const cardElementProps = commonCartridgeOrganizationPropsFactory.build({
					resourcePath: 'path/to/resource',
				});

				return { resource, cardElementProps };
			};

			it('should return file body', () => {
				const { resource, cardElementProps } = setup();

				const result = sut.mapResourceToContentBody(resource, cardElementProps, InputFormat.RICH_TEXT_CK4);
				expect(result).toEqual({
					type: 'file',
					content: {
						caption: 'Resource description',
						alternativeText: '',
					},
				});
			});
		});
	});
});
