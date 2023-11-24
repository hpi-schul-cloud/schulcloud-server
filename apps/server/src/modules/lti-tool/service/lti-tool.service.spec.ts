import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { LtiToolDO } from '@shared/domain/domainobject';
import { LtiToolRepo } from '@shared/repo';
import { ltiToolDOFactory } from '@shared/testing';
import { LtiToolService } from './lti-tool.service';

describe('LtiToolService', () => {
	let module: TestingModule;
	let service: LtiToolService;

	let ltiToolRepo: DeepMocked<LtiToolRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				LtiToolService,
				{
					provide: LtiToolRepo,
					useValue: createMock<LtiToolRepo>(),
				},
			],
		}).compile();

		service = module.get(LtiToolService);
		ltiToolRepo = module.get(LtiToolRepo);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('findByClientIdAndIsLocal', () => {
		describe('when searching for an lti tool', () => {
			const setup = () => {
				const ltiTool: LtiToolDO = ltiToolDOFactory.buildWithId();

				ltiToolRepo.findByClientIdAndIsLocal.mockResolvedValueOnce(ltiTool);

				return {
					ltiTool,
				};
			};

			it('should return an lti tool', async () => {
				const { ltiTool } = setup();

				const result: LtiToolDO | null = await service.findByClientIdAndIsLocal('clientId', true);

				expect(result).toEqual(ltiTool);
			});
		});
	});
});
