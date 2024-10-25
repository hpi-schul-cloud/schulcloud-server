import {
	CardListResponse,
	CardResponse,
	CardResponseElementsInner,
	VisibilitySettingsResponse,
	TimestampsResponse,
	DeletedElementResponse,
	SubmissionContainerElementResponse,
	DrawingElementResponse,
	ExternalToolElementResponse,
	FileElementResponse,
	LinkElementResponse,
	RichTextElementResponse,
} from '../cards-api-client';
import { CardResponseDto } from '../dto/card-response.dto';
import { CollaborativeTextEditorElementResponseDto } from '../dto/collaborative-text-editor-element-response.dto';
import { DeletedElementResponseDto } from '../dto/deleted-element-response.dto';
import { DrawingElementContentDto } from '../dto/drawing-element-content.dto';
import { DrawingElementResponseDto } from '../dto/drawing-element-response.dto';
import { ExternalToolElementContentDto } from '../dto/external-tool-element-content.dto';
import { ExternalToolElementResponseDto } from '../dto/external-tool-element-response.dto';
import { FileElementContentDto } from '../dto/file-element-content.dto';
import { FileElementResponseDto } from '../dto/file-element-response.dto';
import { LinkElementContentDto } from '../dto/link-element-content.dto';
import { LinkElementResponseDto } from '../dto/link-element-response.dto';
import { RichTextElementContentDto } from '../dto/rich-text-element-content.dto';
import { RichTextElementResponseDto } from '../dto/rich-text-element-response.dto';
import { SubmissionContainerElementResponseDto } from '../dto/submission-container-element-response.dto';
import { ContentElementType } from '../enums/content-element-type.enum';
import { SubmissionContainerElementContentDto } from '../dto/submission-container-element-content.dto';
import { DeletedElementContentDto } from '../dto/deleted-element-content.dto';
import { VisibilitySettingsResponseDto } from '../dto/visibility-settings-response.dto';
import { TimestampResponseDto } from '../dto/timestamp-response.dto';
import { CardContentElementInner } from '../types/card-content-elements-inner.type';
import { CardResponseElementsInnerDto } from '../types/card-response-elements-inner.type';
import { CardListResponseDto } from '../dto/card-list-response.dto';

export class CardResponseMapper {
	public static mapToCardListResponseDto(cardListResponse: CardListResponse): CardListResponseDto {
		const cardListResponseDto: CardListResponseDto = new CardListResponseDto([]);

		cardListResponse.data.forEach((cardResponse) => {
			cardListResponseDto.data.push(this.mapToCardResponseDto(cardResponse));
		});
		return cardListResponseDto;
	}

	private static mapToCardResponseDto(cardResponse: CardResponse): CardResponseDto {
		return new CardResponseDto(
			cardResponse.id,
			cardResponse.title as string,
			cardResponse.height,
			this.mapToCardResponseElementsInnerDto(cardResponse.elements),
			this.mapToVisibilitySettingsDto(cardResponse.visibilitySettings),
			this.mapToTimestampDto(cardResponse.timestamps)
		);
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
							this.mapToElementsContent(element, ContentElementType.COLLABORATIVE_TEXT_EDITOR),
							this.mapToTimestampDto(element.timestamps)
						)
					);
					break;
				case ContentElementType.DELETED:
					elements.push(
						new DeletedElementResponseDto(
							element.id,
							ContentElementType.DELETED,
							this.mapToElementsContent(element, ContentElementType.DELETED) as DeletedElementContentDto,
							this.mapToTimestampDto(element.timestamps)
						)
					);
					break;
				case ContentElementType.SUBMISSION_CONTAINER:
					elements.push(
						new SubmissionContainerElementResponseDto(
							element.id,
							ContentElementType.SUBMISSION_CONTAINER,
							this.mapToElementsContent(
								element,
								ContentElementType.SUBMISSION_CONTAINER
							) as SubmissionContainerElementContentDto,
							this.mapToTimestampDto(element.timestamps)
						)
					);
					break;
				case ContentElementType.DRAWING:
					elements.push(
						new DrawingElementResponseDto(
							element.id,
							ContentElementType.DRAWING,
							this.mapToElementsContent(element, ContentElementType.DRAWING) as DrawingElementContentDto,
							this.mapToTimestampDto(element.timestamps)
						)
					);
					break;
				case ContentElementType.EXTERNAL_TOOL:
					elements.push(
						new ExternalToolElementResponseDto(
							element.id,
							ContentElementType.EXTERNAL_TOOL,
							this.mapToElementsContent(element, ContentElementType.EXTERNAL_TOOL) as ExternalToolElementContentDto,
							this.mapToTimestampDto(element.timestamps)
						)
					);
					break;
				case ContentElementType.FILE:
					elements.push(
						new FileElementResponseDto(
							element.id,
							ContentElementType.FILE,
							this.mapToElementsContent(element, ContentElementType.FILE) as FileElementContentDto,
							this.mapToTimestampDto(element.timestamps)
						)
					);
					break;
				case ContentElementType.LINK:
					elements.push(
						new LinkElementResponseDto(
							element.id,
							ContentElementType.LINK,
							this.mapToElementsContent(element, ContentElementType.LINK) as LinkElementContentDto,
							this.mapToTimestampDto(element.timestamps)
						)
					);
					break;
				case ContentElementType.RICH_TEXT:
					elements.push(
						new RichTextElementResponseDto(
							element.id,
							ContentElementType.RICH_TEXT,
							this.mapToElementsContent(element, ContentElementType.RICH_TEXT) as RichTextElementContentDto,
							this.mapToTimestampDto(element.timestamps)
						)
					);
					break;
				default:
					break;
			}
		});
		return elements;
	}

	private static mapToElementsContent(
		response: CardResponseElementsInner,
		elementType: ContentElementType
	): CardContentElementInner {
		// eslint-disable-next-line default-case
		switch (elementType) {
			case ContentElementType.COLLABORATIVE_TEXT_EDITOR:
				return {};
			case ContentElementType.DELETED: {
				const deletedElementContent: DeletedElementResponse = response as DeletedElementResponse;
				return new DeletedElementContentDto(
					deletedElementContent.content.title,
					ContentElementType.DELETED,
					deletedElementContent.content.description
				);
			}
			case ContentElementType.SUBMISSION_CONTAINER: {
				const submissionContainerResponse: SubmissionContainerElementResponse =
					response as SubmissionContainerElementResponse;
				return new SubmissionContainerElementContentDto(submissionContainerResponse.content.dueDate);
			}
			case ContentElementType.DRAWING: {
				const drawingResponse: DrawingElementResponse = response as DrawingElementResponse;
				return new DrawingElementContentDto(drawingResponse.content.description);
			}
			case ContentElementType.EXTERNAL_TOOL: {
				const externalToolResponse: ExternalToolElementResponse = response as ExternalToolElementResponse;
				return new ExternalToolElementContentDto(externalToolResponse.content.contextExternalToolId);
			}
			case ContentElementType.FILE: {
				const fileResponse: FileElementResponse = response as FileElementResponse;
				return new FileElementContentDto(fileResponse.content.caption, fileResponse.content.alternativeText);
			}
			case ContentElementType.LINK: {
				const linkElementResponse: LinkElementResponse = response as LinkElementResponse;
				return new LinkElementContentDto(
					linkElementResponse.content.url,
					linkElementResponse.content.title,
					linkElementResponse.content.description as string,
					linkElementResponse.content.imageUrl as string
				);
			}
			case ContentElementType.RICH_TEXT: {
				const richTextResponse: RichTextElementResponse = response as RichTextElementResponse;
				return new RichTextElementContentDto(richTextResponse.content.text, richTextResponse.content.inputFormat);
			}
			default:
				return this.assertUnreachableCode(elementType);
		}
	}

	private static mapToVisibilitySettingsDto(
		visibilitySettings: VisibilitySettingsResponse
	): VisibilitySettingsResponseDto {
		return new VisibilitySettingsResponseDto(visibilitySettings.publishedAt as string);
	}

	private static mapToTimestampDto(timestamp: TimestampsResponse): TimestampResponseDto {
		return new TimestampResponseDto(timestamp.lastUpdatedAt, timestamp.createdAt, timestamp.deletedAt as string);
	}

	private static assertUnreachableCode(anyObject: never): never {
		// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
		throw new Error(`Unexpected object: ${anyObject}`);
	}
}
