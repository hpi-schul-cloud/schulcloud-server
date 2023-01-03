import { Test, TestingModule } from '@nestjs/testing';
import { externalToolDOFactory } from '@shared/testing/factory/domainobject/external-tool.factory';
import { ExternalToolDO } from '@shared/domain/domainobject/external-tool';
import { SchoolExternalToolMapper } from './school-external-tool.mapper';
import { SchoolExternalToolListResponse, SchoolExternalToolResponse } from '../dto';

describe('SchoolExternalToolMapper', () => {
	let module: TestingModule;
	let mapper: SchoolExternalToolMapper;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [SchoolExternalToolMapper],
		}).compile();

		mapper = module.get(SchoolExternalToolMapper);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('mapExternalToolDOsToSchoolExternalToolListResponse', () => {
		describe('when mapping from ExternalToolDOs to SchoolExternalToolListResponse', () => {
			it('should map from ExternalToolDOs to SchoolExternalToolListResponse', () => {
				const externalToolDOs: ExternalToolDO[] = externalToolDOFactory.buildList(3, {
					id: 'toolId',
					name: 'toolName',
					logoUrl: 'logoUrl',
				});
				const expectedResponse: SchoolExternalToolResponse = new SchoolExternalToolResponse({
					id: 'toolId',
					name: 'toolName',
					logoUrl: 'logoUrl',
				});

				const result: SchoolExternalToolListResponse =
					mapper.mapExternalToolDOsToSchoolExternalToolListResponse(externalToolDOs);

				expect(result.data).toEqual(expect.arrayContaining([expectedResponse, expectedResponse, expectedResponse]));
			});
		});
	});
});
