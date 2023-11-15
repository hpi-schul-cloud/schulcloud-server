import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { DeletionRequestUc } from '../uc';

import { DeletionExecutionsController } from './deletion-executions.controller';

describe(DeletionExecutionsController.name, () => {
	let module: TestingModule;
	let controller: DeletionExecutionsController;
	let uc: DeletionRequestUc;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				{
					provide: DeletionRequestUc,
					useValue: createMock<DeletionRequestUc>(),
				},
			],
			controllers: [DeletionExecutionsController],
		}).compile();

		controller = module.get(DeletionExecutionsController);
		uc = module.get(DeletionRequestUc);
	});

	afterAll(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	describe('deletionRequestUc.executeDeletionRequests', () => {
		describe('when executing deletionRequest', () => {
			const setup = () => {
				const limit = 10;
				const ucSpy = jest.spyOn(uc, 'executeDeletionRequests').mockImplementation();
				return { limit, ucSpy };
			};
			it('should call deletionRequestUc.executeDeletionRequests with limit parameter', async () => {
				const { limit, ucSpy } = setup();
				await controller.executeDeletions({ limit });
				expect(ucSpy).toHaveBeenCalledWith(limit);
			});
		});
	});
});
