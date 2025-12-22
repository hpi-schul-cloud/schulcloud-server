import { Test, TestingModule } from '@nestjs/testing';
import { InputFormat } from '@shared/domain/types';
import { CommonCartridgeXmlResourceType } from '../import/common-cartridge-import.enums';
import {
	CommonCartridgeFileFolderResourceProps,
	CommonCartridgeFileResourceProps,
	CommonCartridgeUnknownResourceProps,
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

			it('should return link for CC 1.1', () => {
				const result = sut.mapResourceTypeToContentElementType(CommonCartridgeXmlResourceType.WEB_LINK_CC11);

				expect(result).toEqual('link');
			});

			it('should return link for CC 1.3', () => {
				const result = sut.mapResourceTypeToContentElementType(CommonCartridgeXmlResourceType.WEB_LINK_CC13);

				expect(result).toEqual('link');
			});

			it('should return rich text', () => {
				const result = sut.mapResourceTypeToContentElementType(CommonCartridgeXmlResourceType.WEB_CONTENT);

				expect(result).toEqual('richText');
			});

			it('should return file', () => {
				const result = sut.mapResourceTypeToContentElementType(CommonCartridgeXmlResourceType.FILE);

				expect(result).toEqual('file');
			});

			it('should return file folder', () => {
				const result = sut.mapResourceTypeToContentElementType(CommonCartridgeXmlResourceType.FILE_FOLDER);

				expect(result).toEqual('fileFolder');
			});
		});
	});

	describe('mapResourceToContentBody', () => {
		describe('when resource is webLink', () => {
			const setup = () => {
				const resource: CommonCartridgeWebLinkResourceProps = {
					type: CommonCartridgeXmlResourceType.WEB_LINK_CC11,
					url: 'https://example.com',
					title: '',
				};

				return { resource };
			};

			it('should return link body', () => {
				const { resource } = setup();

				const result = sut.mapResourceToContentBody(resource, InputFormat.RICH_TEXT_CK4);

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
					type: CommonCartridgeXmlResourceType.WEB_CONTENT,
					html: '<p>Test</p><h1>H1</h1><h2>H2</h2><h3>H3</h3><h4>H4</h4><h5>H5</h5><h6>H6</h6>',
				};

				return { resource };
			};

			it('should return rich text body with headers replaced', () => {
				const { resource } = setup();

				const result = sut.mapResourceToContentBody(resource, InputFormat.RICH_TEXT_CK4);

				expect(result).toEqual({
					type: 'richText',
					content: {
						inputFormat: 'richTextCk4',
						text: '<p>Test</p><h4>H1</h4><h4>H2</h4><h4>H3</h4><h4>H4</h4><h5>H5</h5><h5>H6</h5>',
					},
				});
			});
		});

		describe('when resource is a file', () => {
			const setup = () => {
				const resource: CommonCartridgeFileResourceProps = {
					type: CommonCartridgeXmlResourceType.FILE,
					href: 'path/to/resource',
					fileName: 'resource.jpg',
					file: new File([''], 'resource.jpg'),
					description: 'Resource description',
				};

				return { resource };
			};

			it('should return file body', () => {
				const { resource } = setup();

				const result = sut.mapResourceToContentBody(resource, InputFormat.RICH_TEXT_CK4);
				expect(result).toEqual({
					type: 'file',
					content: {
						caption: 'Resource description',
						alternativeText: '',
					},
				});
			});
		});

		describe('when resource is a file folder', () => {
			const setup = () => {
				const resource: CommonCartridgeFileFolderResourceProps = {
					type: CommonCartridgeXmlResourceType.FILE_FOLDER,
					title: 'Title of folder',
					files: [new File([''], 'resource.jpg')],
				};

				return { resource };
			};

			it('should return file folder body', () => {
				const { resource } = setup();

				const result = sut.mapResourceToContentBody(resource, InputFormat.RICH_TEXT_CK4);
				expect(result).toEqual({
					type: 'fileFolder',
					content: {
						title: 'Title of folder',
					},
				});
			});
		});

		describe('when resource type is unknown', () => {
			const setup = () => {
				const resource: CommonCartridgeUnknownResourceProps = {
					type: CommonCartridgeXmlResourceType.UNKNOWN,
				};

				return { resource };
			};

			it('should return file folder body', () => {
				const { resource } = setup();

				const result = sut.mapResourceToContentBody(resource, InputFormat.RICH_TEXT_CK4);
				expect(result).toBeUndefined();
			});
		});
	});
});
