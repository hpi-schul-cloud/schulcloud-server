import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { DeletionRequestUc } from '../uc';
import { DeletionRequestsController } from './deletion-requests.controller';
import { DeletionRequestBodyPropsBuilder } from '../uc/builder/deletion-request-body-props.builder';
import { DeletionDomainModel } from '../domain/types/deletion-domain-model.enum';
import { deletionRequestFactory } from '../domain/testing/factory/deletion-request.factory';
import { DeletionRequestLogResponseBuilder } from '../uc/builder/deletion-request-log-response.builder';
import { DeletionTargetRefBuilder } from '../uc/builder/deletion-target-ref.builder';

describe(DeletionRequestsController.name, () => {
	let module: TestingModule;
	let controller: DeletionRequestsController;
	let uc: DeletionRequestUc;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				{
					provide: DeletionRequestUc,
					useValue: createMock<DeletionRequestUc>(),
				},
			],
			controllers: [DeletionRequestsController],
		}).compile();

		controller = module.get(DeletionRequestsController);
		uc = module.get(DeletionRequestUc);
	});

	afterAll(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	describe('createDeletionRequests', () => {
		describe('when creating deletionRequest', () => {
			const setup = () => {
				const domain = DeletionDomainModel.PSEUDONYMS;
				const refId = '653e4833cc39e5907a1e18d2';
				const deleteInMinutes = 1000;
				const deletionRequestBody = DeletionRequestBodyPropsBuilder.build(domain, refId, deleteInMinutes);
				const deletionRequest = deletionRequestFactory.build();
				const ucResult = {
					requestId: deletionRequest.id,
					deletionPlannedAt: deletionRequest.deleteAfter,
				};
				const ucSpy = jest.spyOn(uc, 'createDeletionRequest').mockImplementation(() => Promise.resolve(ucResult));
				return { deletionRequestBody, ucResult, ucSpy };
			};
			it('should call deletionRequestUc.createDeletionRequest with deletionRequestBody', async () => {
				const { deletionRequestBody, ucSpy } = setup();
				await controller.createDeletionRequests(deletionRequestBody);

				expect(ucSpy).toHaveBeenCalledWith(deletionRequestBody);
			});

			it('should return deletionRequestResponse', async () => {
				const { deletionRequestBody, ucResult } = setup();
				const result = await controller.createDeletionRequests(deletionRequestBody);

				expect(result).toEqual(ucResult);
			});
		});
	});

	describe('getPerformedDeletionDetail', () => {
		describe('when finding deletionRequests', () => {
			const setup = () => {
				const domain = DeletionDomainModel.PSEUDONYMS;
				const refId = '653e4833cc39e5907a1e18d2';
				const deletionRequest = deletionRequestFactory.build();
				const deletionTargetRef = DeletionTargetRefBuilder.build(domain, refId);
				const ucResult = DeletionRequestLogResponseBuilder.build(deletionTargetRef, deletionRequest.deleteAfter);
				const ucSpy = jest.spyOn(uc, 'findById').mockImplementation(() => Promise.resolve(ucResult));

				return { deletionRequest, ucResult, ucSpy };
			};
			it('should call deletionRequestUc.findById with deletionRequestId', async () => {
				const { deletionRequest, ucSpy } = setup();
				await controller.getPerformedDeletionDetails(deletionRequest.id);

				expect(ucSpy).toHaveBeenCalledWith(deletionRequest.id);
			});

			it('should return deletionRequestLogResponse', async () => {
				const { deletionRequest, ucResult } = setup();
				const result = await controller.getPerformedDeletionDetails(deletionRequest.id);

				expect(result).toEqual(ucResult);
			});
		});
	});

	describe('cancelDeletionRequest', () => {
		describe('when cancel deletionRequests', () => {
			const setup = () => {
				const deletionRequest = deletionRequestFactory.build();
				const ucSpy = jest.spyOn(uc, 'deleteDeletionRequestById').mockImplementation();

				return { deletionRequest, ucSpy };
			};
			it('should call deletionRequestUc.deleteDeletionRequestById with deletionRequestId', async () => {
				const { deletionRequest, ucSpy } = setup();
				await controller.cancelDeletionRequest(deletionRequest.id);

				expect(ucSpy).toHaveBeenCalledWith(deletionRequest.id);
			});
		});
	});
});
