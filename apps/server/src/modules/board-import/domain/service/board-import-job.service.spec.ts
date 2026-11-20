import { Test, type TestingModule } from '@nestjs/testing';
import { boardImportJobFactory } from '../../testing';
import { BoardImportJobStatus } from '../type';
import { BoardImportJobService } from './board-import-job.service';

describe(BoardImportJobService.name, () => {
	let module: TestingModule;
	let service: BoardImportJobService;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [BoardImportJobService],
		}).compile();

		service = module.get(BoardImportJobService);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('create', () => {
		describe('when a user and a link are given', () => {
			const setup = () => {
				const { userId, link } = boardImportJobFactory.build();
				const status = BoardImportJobStatus.FAILED;

				return { userId, link, status };
			};

			it('should return a failed job of the user', async () => {
				const { userId, link, status } = setup();

				const job = await service.create(userId, link);

				expect(job.getProps()).toEqual({ id: expect.any(String), userId, link, status });
			});
		});
	});

	describe('findById', () => {
		describe('when a job id is given', () => {
			const setup = () => {
				const { id } = boardImportJobFactory.build();

				return { id };
			};

			it('should return null', async () => {
				const { id } = setup();

				const result = await service.findById(id);

				expect(result).toBeNull();
			});
		});
	});
});
