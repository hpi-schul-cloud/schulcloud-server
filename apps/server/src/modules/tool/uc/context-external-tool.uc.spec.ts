import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ContextExternalToolService } from '@src/modules/tool/service';
import { contextExternalToolDOFactory, schoolExternalToolDOFactory, setupEntities, userFactory } from "@shared/testing";
import { ContextExternalToolUc } from '@src/modules/tool/uc/context-external-tool.uc';
import { ContextExternalToolDO, SchoolExternalToolDO } from "@shared/domain";
import { CurrentUserMapper } from "@src/modules/authentication/mapper";

describe('ContextExternalTool', () => {
	let module: TestingModule;
	let uc: ContextExternalToolUc;

	let contextExternalToolService: DeepMocked<ContextExternalToolService>;

	beforeAll(async () => {
		await setupEntities();
		module = await Test.createTestingModule({
			providers: [
				ContextExternalToolUc,
				{
					provide: ContextExternalToolService,
					useValue: createMock<ContextExternalToolService>(),
				},
			],
		}).compile();

		uc = module.get(ContextExternalToolUc);
		contextExternalToolService = module.get(ContextExternalToolService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('createContextExternalTool is called', () => {
    const setup = () => {
      const user: User = userFactory.buildWithId();
      const contextExternalTool: ContextExternalToolDO = contextExternalToolDOFactory.build();
      return {
        contextExternalTool,
      };
    };

    describe('when contextExternalTool is given and user has permission ', () => {
			it('should call contextExternalToolService', async () => {
            const { contextExternalTool } = setup();

            await uc.createContextExternalTool(contextExternalTool);


      });
	});
});