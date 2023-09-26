import { SubmissionItem } from './submission-item.do';
import { SubmissionItemFactory } from './submission-item.factory';

describe(SubmissionItemFactory.name, () => {
	describe('build', () => {
		const setup = () => {
			const submissionItemFactory = new SubmissionItemFactory();

			return { submissionItemFactory };
		};

		it('should return SubmissionItem', () => {
			const { submissionItemFactory } = setup();

			const element = submissionItemFactory.build();

			expect(element).toBeInstanceOf(SubmissionItem);
		});
	});
});
