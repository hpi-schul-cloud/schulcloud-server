import { ObjectId } from '@mikro-orm/mongodb';
import { boardImportJobFactory } from '../../testing';
import {
	BOARD_PLAN_VERSION,
	type BoardImportCheckpoint,
	BoardImportJobLogReason,
	BoardImportJobStatus,
	type BoardPlan,
} from '../type';
import { BoardImportJob } from './board-import-job';

describe(BoardImportJob.name, () => {
	describe('getters', () => {
		describe('when the job is built', () => {
			const setup = () => {
				const job = boardImportJobFactory.build({
					startedAt: new Date(),
					failureReason: BoardImportJobLogReason.MAX_ATTEMPTS,
					plan: { version: BOARD_PLAN_VERSION, title: 'Board', columns: [] },
					checkpoints: [{ columnId: new ObjectId().toHexString(), cardIds: [] }],
				});
				const props = job.getProps();

				return { job, props };
			};

			it('should return the props of the job', () => {
				const { job, props } = setup();

				const result = {
					id: job.id,
					status: job.status,
					userId: job.userId,
					source: job.source,
					target: job.target,
					expiresAt: job.expiresAt,
					attempts: job.attempts,
					startedAt: job.startedAt,
					notes: job.notes,
					failureReason: job.failureReason,
					plan: job.plan,
					checkpoints: job.checkpoints,
				};

				expect(result).toEqual(props);
			});
		});
	});

	describe('getDeadline', () => {
		describe('when the job has started', () => {
			const setup = () => {
				const startedAt = new Date('2026-01-01T00:00:00.000Z');
				const now = new Date('2026-01-01T00:10:00.000Z');
				const maxDurationInMs = 25 * 60 * 1000;
				const job = boardImportJobFactory.build({ startedAt });
				const expected = new Date(startedAt.getTime() + maxDurationInMs);

				return { job, now, maxDurationInMs, expected };
			};

			it('should return the first start plus the maximum duration', () => {
				const { job, now, maxDurationInMs, expected } = setup();

				const result = job.getDeadline(maxDurationInMs, now);

				expect(result).toEqual(expected);
			});
		});

		describe('when the job has not started', () => {
			const setup = () => {
				const now = new Date('2026-01-01T00:10:00.000Z');
				const maxDurationInMs = 25 * 60 * 1000;
				const job = boardImportJobFactory.build({ startedAt: undefined });
				const expected = new Date(now.getTime() + maxDurationInMs);

				return { job, now, maxDurationInMs, expected };
			};

			it('should return the given time plus the maximum duration', () => {
				const { job, now, maxDurationInMs, expected } = setup();

				const result = job.getDeadline(maxDurationInMs, now);

				expect(result).toEqual(expected);
			});
		});
	});

	describe('getProgress', () => {
		const newId = (): string => new ObjectId().toHexString();
		const plan: BoardPlan = {
			version: BOARD_PLAN_VERSION,
			title: 'Board',
			columns: [
				{
					title: 'First',
					cards: [
						{ title: 'Card 1', elements: [] },
						{ title: 'Card 2', elements: [] },
					],
				},
				{ title: 'Second', cards: [{ title: 'Card 3', elements: [] }] },
				{ title: 'Third', cards: [] },
			],
		};

		describe('when the job has no plan', () => {
			const setup = () => {
				const job = boardImportJobFactory.build();

				return { job };
			};

			it('should return no progress', () => {
				const { job } = setup();

				const result = job.getProgress();

				expect(result).toBeUndefined();
			});
		});

		describe('when the job has a plan and no checkpoints', () => {
			const setup = () => {
				const job = boardImportJobFactory.build({ plan });
				const total = 6;

				return { job, total };
			};

			it('should count the columns and the cards of the plan as total', () => {
				const { job, total } = setup();

				const result = job.getProgress();

				expect(result).toEqual({ total, imported: 0 });
			});
		});

		describe('when the job has checkpoints', () => {
			const setup = () => {
				const checkpoints: BoardImportCheckpoint[] = [
					{ columnId: newId(), cardIds: [newId(), newId()] },
					{ columnId: newId(), cardIds: [] },
				];
				const job = boardImportJobFactory.build({ plan, checkpoints });
				const total = 6;
				const imported = 4;

				return { job, total, imported };
			};

			it('should count the created columns and cards as imported', () => {
				const { job, total, imported } = setup();

				const result = job.getProgress();

				expect(result).toEqual({ total, imported });
			});
		});

		describe('when the plan of the job has another version', () => {
			const setup = () => {
				const job = boardImportJobFactory.build({ plan: { ...plan, version: BOARD_PLAN_VERSION + 1 } });

				return { job };
			};

			it('should return no progress', () => {
				const { job } = setup();

				const result = job.getProgress();

				expect(result).toBeUndefined();
			});
		});
	});

	describe('isClosed', () => {
		describe.each([
			[BoardImportJobStatus.WAITING, false],
			[BoardImportJobStatus.RUNNING, false],
			[BoardImportJobStatus.FINISHED, true],
			[BoardImportJobStatus.FAILED, true],
		])('when the status is %s', (status, expected) => {
			const setup = () => {
				const job = boardImportJobFactory.build({ status });

				return { job };
			};

			it(`should return ${String(expected)}`, () => {
				const { job } = setup();

				const result = job.isClosed();

				expect(result).toEqual(expected);
			});
		});
	});
});
