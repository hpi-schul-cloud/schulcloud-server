import { SubmissionItem } from './submission-item.do';
import { BoardNodeProps } from './types';
import { fileElementFactory, linkElementFactory, richTextElementFactory } from '../testing';

describe('SubmissionItem', () => {
	const boardNodeProps: BoardNodeProps = {
		id: '1',
		path: '',
		level: 1,
		position: 1,
		children: [],
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	describe('constructor', () => {
		it('should create an instance of SubmissionItem', () => {
			const submissionItem = new SubmissionItem({ ...boardNodeProps, completed: false, userId: '' });
			expect(submissionItem).toBeInstanceOf(SubmissionItem);
		});
	});

	describe('canHaveChild', () => {
		const setup = () => {
			const submissionItem = new SubmissionItem({ ...boardNodeProps, completed: false, userId: '' });

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
			const submissionItem = new SubmissionItem({ ...boardNodeProps, completed: false, userId: '' });
			expect(submissionItem.completed).toBe(false);
		});

		it('should set completed prop', () => {
			const submissionItem = new SubmissionItem({ ...boardNodeProps, completed: false, userId: '' });

			submissionItem.completed = true;
			expect(submissionItem.completed).toBe(true);
		});
	});

	describe('userId property', () => {
		it('should get userId', () => {
			const submissionItem = new SubmissionItem({ ...boardNodeProps, completed: false, userId: '' });
			expect(submissionItem.userId).toBe('');
		});

		it('should set userId', () => {
			const submissionItem = new SubmissionItem({ ...boardNodeProps, completed: false, userId: '' });

			const userId = 'testUserId';
			submissionItem.userId = userId;
			expect(submissionItem.userId).toBe(userId);
		});
	});
});
