import { submissionFactory } from '@shared/testing/factory/submission.factory';
import { setupEntities } from '@shared/testing/setup-entities';
import { SubmissionStatusResponse } from '../controller/dto/submission.response';
import { SubmissionMapper } from './submission.mapper';

describe('Submission Mapper', () => {
	beforeAll(async () => {
		await setupEntities();
	});

	describe('mapToStatusResponse', () => {
		const setup = () => {
			const submission = submissionFactory.buildWithId();

			const expected = new SubmissionStatusResponse({
				id: submission.id,
				submitters: submission.getSubmitterIds(),
				isSubmitted: submission.isSubmitted(),
				grade: submission.grade,
				isGraded: submission.isGraded(),
				submittingCourseGroupName: submission.courseGroup?.name,
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
