import { RichText } from '@modules/task/domain';
import { AnyBoardNode, AnyContentElement, CollaborativeTextEditorElement, ContentElementType, DrawingElement, ExternalToolElement, ExternalToolElementProps, FileElement, FileFolderElement, H5pElement, LinkElement, RichTextElement, SubmissionContainerElement, VideoConferenceElement } from '../../domain';
import { FileContentBody, UpdateElementContentBodyParams } from '../dto';
import { CollaborativeTextEditor } from '@modules/collaborative-text-editor/domain/do/collaborative-text-editor';

export class UpdateImportElementMapper {
	public static mapCardPropsToCardElements(
		contentElement: AnyContentElement,
		cardProp: UpdateElementContentBodyParams
	): AnyContentElement {
        switch (cardProp.data.type) {
            case ContentElementType.FILE:
                {
                    const currentContentElement = contentElement as FileElement;
                    currentContentElement.alternativeText = cardProp.data.content.alternativeText;
                    currentContentElement.caption = cardProp.data.content.caption;
                    return currentContentElement;
                }
            case ContentElementType.LINK:
                {
                    const currentContentElement = contentElement as LinkElement;
                    currentContentElement.url = cardProp.data.content.url;
                    currentContentElement.title = cardProp.data.content.title ?? "";
                    currentContentElement.description = cardProp.data.content.description ?? "";
                    currentContentElement.imageUrl = cardProp.data.content.imageUrl ?? "";
                    currentContentElement.originalImageUrl = cardProp.data.content.originalImageUrl ?? "";
                    return currentContentElement;
                }
            case ContentElementType.RICH_TEXT:
                {
                    const currentContentElement = contentElement as RichTextElement;
                    currentContentElement.text = cardProp.data.content.text;
                    currentContentElement.inputFormat = cardProp.data.content.inputFormat;
                    return currentContentElement;
                }
            case ContentElementType.DRAWING:
                {
                    const currentContentElement = contentElement as DrawingElement;
                    currentContentElement.description = cardProp.data.content.description;
                    return currentContentElement;
                }
            case ContentElementType.FILE_FOLDER:
                {
                    const currentContentElement = contentElement as FileFolderElement;
                    currentContentElement.title = cardProp.data.content.title;
                    return currentContentElement;
                }
            case ContentElementType.SUBMISSION_CONTAINER:
                {
                    const currentContentElement = contentElement as SubmissionContainerElement; 
                    currentContentElement.dueDate = cardProp.data.content.dueDate;
                    return currentContentElement;
                }
            case ContentElementType.VIDEO_CONFERENCE:
                {
                    const currentContentElement = contentElement as VideoConferenceElement;
                    currentContentElement.title = cardProp.data.content.title;
                    return currentContentElement;
                }
            case ContentElementType.EXTERNAL_TOOL:
                {
                    const currentContentElement = contentElement as ExternalToolElement;
                    currentContentElement.contextExternalToolId = cardProp.data.content.contextExternalToolId;
                    return currentContentElement;
                }
            case ContentElementType.H5P:
                {
                    const currentContentElement = contentElement as H5pElement;
                    currentContentElement.contentId = cardProp.data.content.contentId;
                    return currentContentElement;
                }                
        }
	}
}
