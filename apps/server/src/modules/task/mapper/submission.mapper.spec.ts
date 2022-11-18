import { MikroORM } from '@mikro-orm/core';
import { setupEntities, submissionFactory } from '@shared/testing';
import { SubmissionStatusResponse } from '../controller/dto';
import { SubmissionMapper } from './submission.mapper';

describe('Submission Mapper', () => {
	let orm: MikroORM;

	beforeAll(async () => {
		orm = await setupEntities();
	});

	afterAll(async () => {
		await orm.close();
	});

	describe('mapToStatusResponse', () => {
		const setup = () => {
			const submission = submissionFactory.buildWithId();

			const expected = new SubmissionStatusResponse({
				id: submission.id,
				creatorId: submission.student.id,
				grade: submission.grade,
			});

			return { submission, expected };
		};
		it('should map submission', () => {
			const { submission, expected } = setup();

			const result = SubmissionMapper.mapToStatusResponse(submission);

			expect(result).toStrictEqual(expected);
		});
	});
});
