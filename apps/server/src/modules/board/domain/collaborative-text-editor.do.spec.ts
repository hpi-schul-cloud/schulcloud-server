import { CollaborativeTextEditorElement, isCollaborativeTextEditorElement } from './collaborative-text-editor.do';
import { BoardNodeProps } from './types';

describe('CollaborativeTextEditorElement', () => {
	let collaborativeTextEditorElement: CollaborativeTextEditorElement;

	const boardNodeProps: BoardNodeProps = {
		id: '1',
		path: '',
		level: 1,
		position: 1,
		children: [],
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	beforeEach(() => {
		collaborativeTextEditorElement = new CollaborativeTextEditorElement({
			...boardNodeProps,
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
