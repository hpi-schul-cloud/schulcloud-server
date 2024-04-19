import { createMock } from '@golevelup/ts-jest';
import { collaborativeTextEditorElementFactory } from '@shared/testing';
import {
	CollaborativeTextEditorElement,
	isCollaborativeTextEditorElement,
} from './collaborative-text-editor-element.do';
import { BoardCompositeVisitor, BoardCompositeVisitorAsync } from './types';

describe(CollaborativeTextEditorElement.name, () => {
	describe('isAllowedAsChild', () => {
		it('should return false', () => {
			const collaborativeTextEditorElement = collaborativeTextEditorElementFactory.build();

			expect(collaborativeTextEditorElement.isAllowedAsChild()).toBe(false);
		});
	});

	describe('when trying to add a child to a CollaborativeTextEditorElement', () => {
		it('should throw an error ', () => {
			const collaborativeTextEditorElement = collaborativeTextEditorElementFactory.build();
			const collaborativeTextEditorElementChild = collaborativeTextEditorElementFactory.build();

			expect(() => collaborativeTextEditorElement.addChild(collaborativeTextEditorElementChild)).toThrow();
		});
	});

	describe('accept', () => {
		it('should call the right visitor method', () => {
			const visitor = createMock<BoardCompositeVisitor>();
			const collaborativeTextEditorElement = collaborativeTextEditorElementFactory.build();

			collaborativeTextEditorElement.accept(visitor);

			expect(visitor.visitCollaborativeTextEditorElement).toHaveBeenCalledWith(collaborativeTextEditorElement);
		});
	});

	describe('acceptAsync', () => {
		it('should call the right async visitor method', async () => {
			const visitor = createMock<BoardCompositeVisitorAsync>();
			const collaborativeTextEditorElement = collaborativeTextEditorElementFactory.build();

			await collaborativeTextEditorElement.acceptAsync(visitor);

			expect(visitor.visitCollaborativeTextEditorElementAsync).toHaveBeenCalledWith(collaborativeTextEditorElement);
		});
	});

	describe('isCollaborativeTextEditorElement', () => {
		describe('when element is collaborative text editor element', () => {
			it('should return true', () => {
				const collaborativeTextEditorElement = collaborativeTextEditorElementFactory.build();

				expect(isCollaborativeTextEditorElement(collaborativeTextEditorElement)).toBe(true);
			});
		});

		describe('when element is not collaborative text editor element', () => {
			it('should return false', () => {
				const notCollaborativeTextEditorElement = {};

				expect(isCollaborativeTextEditorElement(notCollaborativeTextEditorElement)).toBe(false);
			});
		});
	});
});
