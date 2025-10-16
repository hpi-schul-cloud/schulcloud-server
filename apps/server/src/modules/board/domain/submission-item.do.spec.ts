import { fileElementFactory, linkElementFactory, richTextElementFactory, submissionItemFactory } from '../testing';

describe('SubmissionItem', () => {
	describe('canHaveChild', () => {
		const setup = () => {
			const submissionItem = submissionItemFactory.build({ completed: false, userId: '' });

			const linkElement = linkElementFactory.build();
			const fileElement = fileElementFactory.build();
			const richTextElement = richTextElementFactory.build();

			return { submissionItem, linkElement, fileElement, richTextElement };
		};

		it('should return true for RichTextElement child', () => {
			const { submissionItem, richTextElement } = setup();

			const result = submissionItem.canHaveChild(richTextElement);

			expect(result).toBe(true);
		});

		it('should return true for FileElement child', () => {
			const { submissionItem, fileElement } = setup();

			const result = submissionItem.canHaveChild(fileElement);

			expect(result).toBe(true);
		});

		it('should return false for non-RichTextElement and non-FileElement child', () => {
			const { submissionItem, linkElement } = setup();

			const result = submissionItem.canHaveChild(linkElement);

			expect(result).toBe(false);
		});
	});

	describe('completed property', () => {
		it('should get completed prop', () => {
			const submissionItem = submissionItemFactory.build({ completed: false, userId: '' });
			expect(submissionItem.completed).toBe(false);
		});

		it('should set completed prop', () => {
			const submissionItem = submissionItemFactory.build({ completed: false, userId: '' });

			submissionItem.completed = true;
			expect(submissionItem.completed).toBe(true);
		});
	});

	describe('userId property', () => {
		it('should get userId', () => {
			const submissionItem = submissionItemFactory.build({ completed: false, userId: '' });
			expect(submissionItem.userId).toBe('');
		});

		it('should set userId', () => {
			const submissionItem = submissionItemFactory.build({ completed: false, userId: '' });

			const userId = 'testUserId';
			submissionItem.userId = userId;
			expect(submissionItem.userId).toBe(userId);
		});
	});
});
