import { createMock } from '@golevelup/ts-jest';
import { submissionContainerElementFactory, submissionItemFactory } from '@shared/testing/factory';
import { SubmissionContainerElement } from './submission-container-element.do';
import { BoardCompositeVisitor, BoardCompositeVisitorAsync } from './types';

describe(SubmissionContainerElement.name, () => {
	describe('when trying to add a child to a submission container element', () => {
		it('should throw an error ', () => {
			const submissionContainerElement = submissionContainerElementFactory.build();
			const submissionContainerElementChild = submissionContainerElementFactory.build();

			expect(() => submissionContainerElement.addChild(submissionContainerElementChild)).toThrow();
		});

		it('should not throw if child is submission-item ', () => {
			const submissionContainerElement = submissionContainerElementFactory.build();
			const submissionContainerElementChild = submissionItemFactory.build();

			expect(() => submissionContainerElement.addChild(submissionContainerElementChild)).not.toThrow();
		});
	});

	describe('accept', () => {
		it('should call the right visitor method', () => {
			const visitor = createMock<BoardCompositeVisitor>();
			const submissionContainerElement = submissionContainerElementFactory.build();

			submissionContainerElement.accept(visitor);

			expect(visitor.visitSubmissionContainerElement).toHaveBeenCalledWith(submissionContainerElement);
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
});
