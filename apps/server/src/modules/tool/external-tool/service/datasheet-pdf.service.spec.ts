import { Test, TestingModule } from '@nestjs/testing';
import { UserDO } from '@shared/domain/domainobject';
import { userDoFactory } from '@shared/testing';
import { createPdf, TCreatedPdf } from 'pdfmake/build/pdfmake';
import { TDocumentDefinitions } from 'pdfmake/interfaces';
import { CustomParameter } from '../../common/domain';
import { ExternalTool, ExternalToolDatasheetTemplateData } from '../domain';
import { customParameterFactory, externalToolDatasheetTemplateDataFactory, externalToolFactory } from '../testing';
import { DatasheetPdfService } from './datasheet-pdf.service';

jest.mock('pdfmake/build/pdfmake');

const mockCreatePdf = createPdf as jest.MockedFunction<
	(documentDefinitions: TDocumentDefinitions) => Partial<TCreatedPdf>
>;

const setupMockCreatePdf = (error?: boolean) => {
	if (error) {
		mockCreatePdf.mockImplementation(() => {
			throw new Error('error from createPdf');
		});
	} else {
		mockCreatePdf.mockImplementation((): Partial<TCreatedPdf> => {
			return {
				getBuffer: jest.fn().mockImplementation((callback: (buffer: Buffer) => void) => {
					callback(Buffer.from('fake-pdf-content'));
				}),
			};
		});
	}
};

describe(DatasheetPdfService.name, () => {
	let module: TestingModule;
	let service: DatasheetPdfService;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [DatasheetPdfService],
		}).compile();

		service = module.get(DatasheetPdfService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('generatePdf', () => {
		describe('when tool is oauth2 tool with optional properties and custom parameters', () => {
			const setup = () => {
				const user: UserDO = userDoFactory.buildWithId();

				const param: CustomParameter = customParameterFactory.build();
				const externalTool: ExternalTool = externalToolFactory.build({ parameters: [param] });
				const datasheetData: ExternalToolDatasheetTemplateData = externalToolDatasheetTemplateDataFactory
					.withParameters(1, { name: param.name })
					.withOptionalProperties()
					.asOauth2Tool()
					.build({
						toolName: externalTool.name,
						instance: 'dBildungscloud',
						creatorName: `${user.firstName} ${user.lastName}`,
						schoolName: 'schoolName',
					});

				setupMockCreatePdf(false);

				return { datasheetData };
			};

			it('should return Buffer', async () => {
				const { datasheetData } = setup();

				const result = await service.generatePdf(datasheetData);

				expect(result).toEqual(expect.any(Uint8Array));
			});
		});

		describe('when tool is lti tool without custom parameters', () => {
			const setup = () => {
				const user: UserDO = userDoFactory.buildWithId();

				const param: CustomParameter = customParameterFactory.build();
				const externalTool: ExternalTool = externalToolFactory.build({ parameters: [param] });
				const datasheetData: ExternalToolDatasheetTemplateData = externalToolDatasheetTemplateDataFactory
					.asLti11Tool()
					.build({
						toolName: externalTool.name,
						instance: 'dBildungscloud',
						creatorName: `${user.firstName} ${user.lastName}`,
					});

				setupMockCreatePdf(false);

				return { datasheetData };
			};

			it('should return Buffer', async () => {
				const { datasheetData } = setup();

				const result = await service.generatePdf(datasheetData);

				expect(result).toEqual(expect.any(Uint8Array));
			});
		});

		describe('when an error occurs', () => {
			const setup = () => {
				const user: UserDO = userDoFactory.buildWithId();

				const param: CustomParameter = customParameterFactory.build();
				const externalTool: ExternalTool = externalToolFactory.build({ parameters: [param] });
				const datasheetData: ExternalToolDatasheetTemplateData = externalToolDatasheetTemplateDataFactory
					.withParameters(1, { name: param.name })
					.build({
						toolName: externalTool.name,
						instance: 'dBildungscloud',
						creatorName: `${user.firstName} ${user.lastName}`,
					});

				setupMockCreatePdf(true);

				return { datasheetData };
			};

			it('should throw an error', async () => {
				const { datasheetData } = setup();

				await expect(service.generatePdf(datasheetData)).rejects.toThrowError('error from createPdf');
			});
		});
	});
});
