import { CollaborativeTextEditor } from '../../domain/do/collaborative-text-editor';
import { CollaborativeTextEditorResponse } from '../dto/collaborative-text-editor.response';

export class CollaborativeTextEditorMapper {
	public static mapCollaborativeTextEditorToResponse(
		collaborativeTextEditor: CollaborativeTextEditor
	): CollaborativeTextEditorResponse {
		const dto = new CollaborativeTextEditorResponse({
			url: collaborativeTextEditor.url,
		});

		return dto;
	}
}
