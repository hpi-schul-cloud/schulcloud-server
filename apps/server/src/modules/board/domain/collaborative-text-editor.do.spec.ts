import { collaborativeTextEditorFactory } from '../testing';
import { type CollaborativeTextEditorElement, isCollaborativeTextEditorElement } from './collaborative-text-editor.do';

describe('CollaborativeTextEditorElement', () => {
	let collaborativeTextEditorElement: CollaborativeTextEditorElement;

	beforeEach(() => {
		collaborativeTextEditorElement = collaborativeTextEditorFactory.build({
			children: [],
		});
	});

	it('should be instance of CollaborativeTextEditorElement', () => {
		expect(isCollaborativeTextEditorElement(collaborativeTextEditorElement)).toBe(true);
	});

	it('should not be instance of CollaborativeTextEditorElement', () => {
		expect(isCollaborativeTextEditorElement({})).toBe(false);
	});

	it('should not have child', () => {
		expect(collaborativeTextEditorElement.canHaveChild()).toBe(false);
	});
});
