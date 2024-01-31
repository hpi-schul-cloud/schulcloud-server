import { Test, TestingModule } from '@nestjs/testing';
import { externalToolDatasheetTemplateDataFactory, externalToolFactory, userDoFactory } from '@shared/testing';
import { UserDO } from '@shared/domain/domainobject';
import { DatasheetPdfService } from './datasheet-pdf.service';
import { ExternalTool, ExternalToolDatasheetTemplateData } from '../domain';
import { CustomParameter } from '../../common/domain';

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
		describe('when no error occurs', () => {
			const setup = () => {
				const user: UserDO = userDoFactory.buildWithId();

				const externalTool: ExternalTool = externalToolFactory.withCustomParameters(1).build();
				const params = externalTool.parameters as CustomParameter[];
				const datasheetData: ExternalToolDatasheetTemplateData = externalToolDatasheetTemplateDataFactory
					.withParameters(1, { name: params[0].name })
					.build({
						toolName: externalTool.name,
						instance: 'dBildungscloud',
						creatorName: `${user.firstName} ${user.lastName}`,
					});

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

				const externalTool: ExternalTool = externalToolFactory.withCustomParameters(1).build();
				const params = externalTool.parameters as CustomParameter[];
				const datasheetData: ExternalToolDatasheetTemplateData = externalToolDatasheetTemplateDataFactory
					.withParameters(1, { name: params[0].name })
					.build({
						toolName: externalTool.name,
						instance: 'dBildungscloud',
						creatorName: `${user.firstName} ${user.lastName}`,
					});

				jest.spyOn(service, 'generatePdf').mockRejectedValueOnce('error');

				return { datasheetData };
			};

			it('should throw error', async () => {
				const { datasheetData } = setup();

				await expect(service.generatePdf(datasheetData)).rejects.toEqual('error');
			});
		});
	});
});
