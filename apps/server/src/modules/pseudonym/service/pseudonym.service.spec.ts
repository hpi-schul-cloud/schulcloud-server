import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PseudonymDO } from '@shared/domain';
import { PseudonymsRepo } from '@shared/repo';
import { pseudonymDOFactory } from '@shared/testing/factory/domainobject/pseudonym.factory';
import { PseudonymService } from './pseudonym.service';

describe('PseudonymService', () => {
	let module: TestingModule;
	let service: PseudonymService;

	let pseudonymRepo: DeepMocked<PseudonymsRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				PseudonymService,
				{
					provide: PseudonymsRepo,
					useValue: createMock<PseudonymsRepo>(),
				},
			],
		}).compile();

		service = module.get(PseudonymService);
		pseudonymRepo = module.get(PseudonymsRepo);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('findByUserIdAndToolId', () => {
		describe('when searching by userId and toolId', () => {
			const setup = () => {
				const pseudonym: PseudonymDO = pseudonymDOFactory.buildWithId();

				pseudonymRepo.findByUserIdAndToolId.mockResolvedValue(pseudonym);

				return {
					pseudonym,
				};
			};

			it('should call pseudonymRepo.findByUserIdAndToolId', async () => {
				setup();

				await service.findByUserIdAndToolId('userId', 'toolId');

				expect(pseudonymRepo.findByUserIdAndToolId).toHaveBeenCalledWith('userId', 'toolId');
			});

			it('should return a pseudonym', async () => {
				const { pseudonym } = setup();

				const result: PseudonymDO = await service.findByUserIdAndToolId('userId', 'toolId');

				expect(result).toEqual(pseudonym);
			});
		});

		describe('when the repo throws an error', () => {
			const setup = () => {
				pseudonymRepo.findByUserIdAndToolId.mockRejectedValue(new NotFoundException());
			};

			it('should pass the error without catching', async () => {
				setup();

				const func = async () => service.findByUserIdAndToolId('userId', 'toolId');

				await expect(func).rejects.toThrow(NotFoundException);
			});
		});
	});
});
