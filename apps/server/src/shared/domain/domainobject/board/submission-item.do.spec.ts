import { createMock } from '@golevelup/ts-jest';
import { submissionContainerElementFactory, submissionItemFactory } from '@shared/testing/factory';
import { ObjectId } from '@mikro-orm/mongodb';
import { SubmissionItem } from './submission-item.do';
import { BoardCompositeVisitor, BoardCompositeVisitorAsync } from './types';

describe(SubmissionItem.name, () => {
	describe('when trying to add a child to a submission item element', () => {
		it('should throw an error ', () => {
			const submissionItem = submissionItemFactory.build();
			const submissionItemChild = submissionItemFactory.build();

			expect(() => submissionItem.addChild(submissionItemChild)).toThrow();
		});
	});

	describe('accept', () => {
		it('should call the right visitor method', () => {
			const visitor = createMock<BoardCompositeVisitor>();
			const submissionItem = submissionItemFactory.build();

			submissionItem.accept(visitor);

			expect(visitor.visitSubmissionItem).toHaveBeenCalledWith(submissionItem);
		});
	});

	describe('acceptAsync', () => {
		it('should call the right async visitor method', async () => {
			const visitor = createMock<BoardCompositeVisitorAsync>();
			const submissionContainerElement = submissionContainerElementFactory.build();

			await submissionContainerElement.acceptAsync(visitor);

			expect(visitor.visitSubmissionContainerElementAsync).toHaveBeenCalledWith(submissionContainerElement);
		});
	});

	describe('set userId', () => {
		it('should set userId', () => {
			const userId = new ObjectId().toHexString();
			const submissionItem = submissionItemFactory.build();
			submissionItem.userId = userId;

			expect(submissionItem.userId).toEqual(userId);
		});
	});

	describe('set completed', () => {
		it('should set completed', () => {
			const completed = true;
			const submissionItem = submissionItemFactory.build();
			submissionItem.completed = completed;

			expect(submissionItem.completed).toEqual(completed);
		});
	});
});
