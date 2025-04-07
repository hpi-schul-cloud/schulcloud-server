import {
	CardListResponse,
	CardResponse,
	CardResponseElementsInner,
	DeletedElementContent,
	DrawingElementContent,
	ExternalToolElementContent,
	FileElementContent,
	FileFolderElementContent,
	LinkElementContent,
	RichTextElementContent,
	SubmissionContainerElementContent,
	TimestampsResponse,
	VideoConferenceElementContent,
	VisibilitySettingsResponse,
} from '../cards-api-client';
import { CardListResponseDto } from '../dto/card-list-response.dto';
import { CardResponseDto } from '../dto/card-response.dto';
import { CollaborativeTextEditorElementResponseDto } from '../dto/collaborative-text-editor-element-response.dto';
import { DeletedElementContentDto } from '../dto/deleted-element-content.dto';
import { DeletedElementResponseDto } from '../dto/deleted-element-response.dto';
import { DrawingElementContentDto } from '../dto/drawing-element-content.dto';
import { DrawingElementResponseDto } from '../dto/drawing-element-response.dto';
import { ExternalToolElementContentDto } from '../dto/external-tool-element-content.dto';
import { ExternalToolElementResponseDto } from '../dto/external-tool-element-response.dto';
import { FileElementContentDto } from '../dto/file-element-content.dto';
import { FileElementResponseDto } from '../dto/file-element-response.dto';
import { FileFolderElementContentDto } from '../dto/file-folder-element-content.dto';
import { FileFolderElementResponseDto } from '../dto/file-folder-element-response.dto';
import { LinkElementContentDto } from '../dto/link-element-content.dto';
import { LinkElementResponseDto } from '../dto/link-element-response.dto';
import { RichTextElementContentDto } from '../dto/rich-text-element-content.dto';
import { RichTextElementResponseDto } from '../dto/rich-text-element-response.dto';
import { SubmissionContainerElementContentDto } from '../dto/submission-container-element-content.dto';
import { SubmissionContainerElementResponseDto } from '../dto/submission-container-element-response.dto';
import { TimestampResponseDto } from '../dto/timestamp-response.dto';
import { VideoConferenceElementContentDto } from '../dto/video-conference-element-content.dto';
import { VideoConferenceElementResponseDto } from '../dto/video-conference-element-response.dto';
import { VisibilitySettingsResponseDto } from '../dto/visibility-settings-response.dto';
import { ContentElementType } from '../enums/content-element-type.enum';
import { CardResponseElementsInnerDto } from '../types/card-response-elements-inner.type';

export class CardResponseMapper {
	public static mapToCardListResponseDto(cardListResponse: CardListResponse): CardListResponseDto {
		const cardListResponseDto: CardListResponseDto = new CardListResponseDto([]);

		cardListResponse.data.forEach((cardResponse) => {
			cardListResponseDto.data.push(this.mapToCardResponseDto(cardResponse));
		});
		return cardListResponseDto;
	}

	private static mapToCardResponseDto(cardResponse: CardResponse): CardResponseDto {
		return new CardResponseDto({
			id: cardResponse.id,
			title: cardResponse.title,
			height: cardResponse.height,
			elements: this.mapToCardResponseElementsInnerDto(cardResponse.elements),
			visibilitySettings: this.mapToVisibilitySettingsDto(cardResponse.visibilitySettings),
			timeStamps: this.mapToTimestampDto(cardResponse.timestamps),
		});
	}

	private static mapToCardResponseElementsInnerDto(
		cardResponseElementsInner: CardResponseElementsInner[]
	): CardResponseElementsInnerDto[] {
		const elements: CardResponseElementsInnerDto[] = [];

		cardResponseElementsInner.forEach((element) => {
			switch (element.type) {
				case ContentElementType.COLLABORATIVE_TEXT_EDITOR:
					elements.push(
						new CollaborativeTextEditorElementResponseDto(
							element.id,
							ContentElementType.COLLABORATIVE_TEXT_EDITOR,
							{ ...element.content },
							this.mapToTimestampDto(element.timestamps)
						)
					);
					break;
				case ContentElementType.DELETED: {
					const content: DeletedElementContent = element.content as DeletedElementContent;
					elements.push(
						new DeletedElementResponseDto(
							element.id,
							ContentElementType.DELETED,
							new DeletedElementContentDto(content.title, ContentElementType.DELETED, content.description),
							this.mapToTimestampDto(element.timestamps)
						)
					);
					break;
				}
				case ContentElementType.SUBMISSION_CONTAINER: {
					const content: SubmissionContainerElementContent = element.content as SubmissionContainerElementContent;
					elements.push(
						new SubmissionContainerElementResponseDto(
							element.id,
							ContentElementType.SUBMISSION_CONTAINER,
							new SubmissionContainerElementContentDto(content.dueDate),
							this.mapToTimestampDto(element.timestamps)
						)
					);
					break;
				}
				case ContentElementType.DRAWING: {
					const content: DrawingElementContent = element.content as DrawingElementContent;
					elements.push(
						new DrawingElementResponseDto(
							element.id,
							ContentElementType.DRAWING,
							new DrawingElementContentDto(content.description),
							this.mapToTimestampDto(element.timestamps)
						)
					);
					break;
				}
				case ContentElementType.EXTERNAL_TOOL: {
					const content: ExternalToolElementContent = element.content as ExternalToolElementContent;
					elements.push(
						new ExternalToolElementResponseDto(
							element.id,
							ContentElementType.EXTERNAL_TOOL,
							new ExternalToolElementContentDto(content.contextExternalToolId),
							this.mapToTimestampDto(element.timestamps)
						)
					);
					break;
				}
				case ContentElementType.FILE: {
					const content: FileElementContent = element.content as FileElementContent;
					elements.push(
						new FileElementResponseDto({
							id: element.id,
							type: ContentElementType.FILE,
							content: new FileElementContentDto(content.caption, content.alternativeText),
							timestamps: this.mapToTimestampDto(element.timestamps),
						})
					);
					break;
				}
				case ContentElementType.LINK: {
					const content: LinkElementContent = element.content as LinkElementContent;
					elements.push(
						new LinkElementResponseDto({
							id: element.id,
							type: ContentElementType.LINK,
							content: new LinkElementContentDto({
								url: content.url,
								title: content.title,
								description: content.description,
							}),
							timestamps: this.mapToTimestampDto(element.timestamps),
						})
					);
					break;
				}
				case ContentElementType.RICH_TEXT: {
					const content: RichTextElementContent = element.content as RichTextElementContent;
					elements.push(
						new RichTextElementResponseDto({
							id: element.id,
							type: ContentElementType.RICH_TEXT,
							content: new RichTextElementContentDto(content.text, content.inputFormat),
							timestamps: this.mapToTimestampDto(element.timestamps),
						})
					);
					break;
				}
				case ContentElementType.VIDEO_CONFERENCE: {
					const content: VideoConferenceElementContent = element.content as VideoConferenceElementContent;
					elements.push(
						new VideoConferenceElementResponseDto(
							element.id,
							ContentElementType.VIDEO_CONFERENCE,
							new VideoConferenceElementContentDto(content.title),
							this.mapToTimestampDto(element.timestamps)
						)
					);
					break;
				}
				case ContentElementType.FILE_FOLDER: {
					const content: FileFolderElementContent = element.content as FileFolderElementContent;
					elements.push(
						new FileFolderElementResponseDto(
							element.id,
							ContentElementType.FILE_FOLDER,
							new FileFolderElementContentDto(content.title),
							this.mapToTimestampDto(element.timestamps)
						)
					);
					break;
				}
				default:
					break;
			}
		});
		return elements;
	}

	private static mapToVisibilitySettingsDto(
		visibilitySettings: VisibilitySettingsResponse
	): VisibilitySettingsResponseDto {
		return new VisibilitySettingsResponseDto(visibilitySettings.publishedAt ?? '');
	}

	private static mapToTimestampDto(timestamp: TimestampsResponse): TimestampResponseDto {
		return new TimestampResponseDto({
			lastUpdatedAt: timestamp.lastUpdatedAt,
			createdAt: timestamp.createdAt,
			deletedAt: timestamp.deletedAt,
		});
	}
}
