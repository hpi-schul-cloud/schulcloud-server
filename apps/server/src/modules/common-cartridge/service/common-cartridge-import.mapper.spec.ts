/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { CommonCartridgeResourceTypeV1P1 } from '../import/common-cartridge-import.enums';
import {
	CommonCartridgeOrganizationProps,
	CommonCartridgeWebContentResourceProps,
	CommonCartridgeWebLinkResourceProps,
} from '../import/common-cartridge-import.types';
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
		});
	});

	describe('mapToResourceBody', () => {
		describe('when resource is provided', () => {
			describe('when resource is webLink', () => {
				const setup = () => {
					const resource: CommonCartridgeWebLinkResourceProps = {
						type: CommonCartridgeResourceTypeV1P1.WEB_LINK,
						url: 'https://example.com',
						title: '',
					};

					const cardElementProps: CommonCartridgeOrganizationProps = {
						resourcePath: 'path/to/resource',
						path: 'path/to/resource',
						pathDepth: 1,
						identifier: 'resource-id',
						title: 'Resource Title',
						isResource: true,
						isInlined: false,
						resourceType: 'webLink',
					};

					const result = sut.mapResourceToContentBody(resource, cardElementProps);

					return result;
				};

				it('should return link body', () => {
					const result = setup();
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

					const cardElementProps: CommonCartridgeOrganizationProps = {
						resourcePath: 'path/to/resource.html',
						path: 'path/to/resource',
						pathDepth: 1,
						identifier: 'resource-id',
						title: 'Resource Title',
						isResource: true,
						isInlined: false,
						resourceType: 'webContent',
					};

					const result = sut.mapResourceToContentBody(resource, cardElementProps);

					return result;
				};

				it('should return rich text body', () => {
					const result = setup();

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

					const cardElementProps: CommonCartridgeOrganizationProps = {
						resourcePath: 'path/to/resource.jpg',
						path: 'path/to/resource',
						pathDepth: 1,
						identifier: 'resource-id',
						title: 'Resource Title',
						isResource: true,
						isInlined: false,
						resourceType: 'webContent',
					};

					const result = sut.mapResourceToContentBody(resource, cardElementProps);

					return result;
				};

				it('should return undefined for unknown resource type', () => {
					const result = setup();

					expect(result).toEqual(undefined);
				});
			});
		});
	});
});
