import { createMock } from '@golevelup/ts-jest';
import { submissionContainerElementFactory } from '@shared/testing';
import { SubmissionContainerElement } from './submission-container-element.do';
import { BoardCompositeVisitor, BoardCompositeVisitorAsync } from './types';

describe(SubmissionContainerElement.name, () => {
	describe('when trying to add a child to a task element', () => {
		it('should throw an error ', () => {
			const taskElement = submissionContainerElementFactory.build();
			const taskElementChild = submissionContainerElementFactory.build();

			expect(() => taskElement.addChild(taskElementChild)).toThrow();
		});
	});

	describe('accept', () => {
		it('should call the right visitor method', () => {
			const visitor = createMock<BoardCompositeVisitor>();
			const taskElement = submissionContainerElementFactory.build();

			taskElement.accept(visitor);

			expect(visitor.visitTaskElement).toHaveBeenCalledWith(taskElement);
		});
	});

	describe('acceptAsync', () => {
		it('should call the right async visitor method', async () => {
			const visitor = createMock<BoardCompositeVisitorAsync>();
			const taskElement = submissionContainerElementFactory.build();

			await taskElement.acceptAsync(visitor);

			expect(visitor.visitTaskElementAsync).toHaveBeenCalledWith(taskElement);
		});
	});
});
