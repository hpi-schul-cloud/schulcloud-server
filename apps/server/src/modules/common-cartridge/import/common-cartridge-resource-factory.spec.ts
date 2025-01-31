import { faker } from '@faker-js/faker/locale/af_ZA';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { InputFormat } from '@shared/domain/types';
import AdmZip from 'adm-zip';
import { readFile } from 'node:fs/promises';
import { CommonCartridgeResourceTypeV1P1 } from './common-cartridge-import.enums';
import { CommonCartridgeOrganizationProps, CommonCartridgeWebLinkResourceProps } from './common-cartridge-import.types';
import { CommonCartridgeResourceFactory } from './common-cartridge-resource-factory';

describe('CommonCartridgeResourceFactory', () => {
	let sut: CommonCartridgeResourceFactory;
	let admZipMock: DeepMocked<AdmZip>;
	let webLinkXml: string | undefined;

	const setupWebLinkXml = async () => {
		// caching the web link xml to avoid reading the file multiple times from disk
		if (!webLinkXml) {
			webLinkXml = await readFile(
				'./apps/server/src/modules/common-cartridge/testing/assets/v1.1.0/weblink.xml',
				'utf-8'
			);

			return webLinkXml;
		}

		return webLinkXml;
	};
	const setupWebContentHtml = () => {
		const webContentHtml = `<html>
				<head>
					<title>Title</title>
				</head>
				<body>
					<p>Content</p>
				</body>
			</html>`;

		return webContentHtml;
	};
	const setupOrganizationProps = () => {
		const organizationProps: CommonCartridgeOrganizationProps = {
			identifier: faker.string.uuid(),
			identifierRef: faker.string.uuid(),
			title: faker.lorem.sentence(),
			path: faker.system.filePath(),
			pathDepth: faker.number.int({ min: 1, max: 5 }),
			isResource: true,
			isInlined: false,
			resourcePath: faker.system.filePath(),
			resourceType: faker.lorem.word(),
		};

		return organizationProps;
	};

	beforeAll(() => {
		admZipMock = createMock<AdmZip>();
		sut = new CommonCartridgeResourceFactory(admZipMock);
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(sut).toBeDefined();
	});

	describe('create', () => {
		describe('when creating a web link resource', () => {
			const setup = async () => {
				webLinkXml = await setupWebLinkXml();
				const organizationProps = setupOrganizationProps();

				organizationProps.resourceType = CommonCartridgeResourceTypeV1P1.WEB_LINK;
				admZipMock.getEntry.mockReturnValue({} as AdmZip.IZipEntry);
				admZipMock.readAsText.mockReturnValue(webLinkXml);

				return { organizationProps };
			};

			it('should create a web link resource', async () => {
				const { organizationProps } = await setup();

				const result = sut.create(organizationProps, InputFormat.RICH_TEXT_CK5);

				expect(result).toStrictEqual<CommonCartridgeWebLinkResourceProps>({
					type: CommonCartridgeResourceTypeV1P1.WEB_LINK,
					title: organizationProps.title,
					url: 'http://www.example.tld',
				});
			});
		});

		describe('when creating a web link resource and the descriptor is not valid XML', () => {
			const setup = () => {
				const organizationProps = setupOrganizationProps();

				organizationProps.resourceType = CommonCartridgeResourceTypeV1P1.WEB_LINK;
				admZipMock.getEntry.mockReturnValue({} as AdmZip.IZipEntry);
				admZipMock.readAsText.mockReturnValue(faker.lorem.sentence());

				return { organizationProps };
			};

			it('should return undefined', () => {
				const { organizationProps } = setup();

				const result = sut.create(organizationProps, InputFormat.RICH_TEXT_CK5);

				expect(result).toBeUndefined();
			});
		});

		describe('when resource is not supported', () => {
			const setup = () => {
				const organizationProps = setupOrganizationProps();

				organizationProps.resourceType = faker.lorem.word();

				return { organizationProps };
			};

			it('should return undefined', () => {
				const { organizationProps } = setup();

				const result = sut.create(organizationProps, InputFormat.RICH_TEXT_CK5);

				expect(result).toBeUndefined();
			});
		});

		describe('when organization is not valid', () => {
			const setup = () => {
				const organizationProps = setupOrganizationProps();

				organizationProps.isResource = false;
				admZipMock.getEntry.mockReturnValue(null);

				return { organizationProps };
			};

			it('should return undefined', () => {
				const { organizationProps } = setup();

				const result = sut.create(organizationProps, InputFormat.RICH_TEXT_CK5);

				expect(result).toBeUndefined();
			});
		});

		describe('when web content is provided', () => {
			const setup = () => {
				const webContentHtml = setupWebContentHtml();
				const organizationProps = setupOrganizationProps();

				organizationProps.resourceType = CommonCartridgeResourceTypeV1P1.WEB_CONTENT;
				admZipMock.getEntry.mockReturnValue({} as AdmZip.IZipEntry);
				admZipMock.readAsText.mockReturnValue(webContentHtml);

				return { organizationProps };
			};

			it('should create a web content resource', () => {
				const { organizationProps } = setup();

				const result = sut.create(organizationProps, InputFormat.RICH_TEXT_CK5);

				expect(result).toStrictEqual({
					type: CommonCartridgeResourceTypeV1P1.WEB_CONTENT,
					html: '<p>Content</p>',
				});
			});
		});

		describe('when web content is not provided', () => {
			const setup = () => {
				const organizationProps = setupOrganizationProps();

				organizationProps.resourceType = CommonCartridgeResourceTypeV1P1.WEB_CONTENT;
				admZipMock.getEntry.mockReturnValue({} as AdmZip.IZipEntry);
				admZipMock.readAsText.mockReturnValue('');

				return { organizationProps };
			};
			it('should return an empty value', () => {
				const { organizationProps } = setup();

				const result = sut.create(organizationProps, InputFormat.RICH_TEXT_CK5);

				expect(result).toStrictEqual({
					type: CommonCartridgeResourceTypeV1P1.WEB_CONTENT,
					html: '',
				});
			});
		});

		describe('when html is not valid', () => {
			const setup = () => {
				const organizationProps = setupOrganizationProps();
				organizationProps.resourceType = CommonCartridgeResourceTypeV1P1.WEB_CONTENT;
				const tryCreateDocumentMock = jest.fn().mockReturnValue(undefined);
				Reflect.set(sut, 'tryCreateDocument', tryCreateDocumentMock);

				return { organizationProps };
			};
			it('should return undefined', () => {
				const { organizationProps } = setup();

				const result = sut.create(organizationProps, InputFormat.RICH_TEXT_CK5);

				expect(result).toBeUndefined();
			});
		});
	});
});
