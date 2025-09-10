import {
	AnyElementContentBody,
	CreateBoardBodyParams,
	FileContentBody,
	FileElementContentBody,
	LinkContentBody,
	LinkElementContentBody,
	RichTextContentBody,
	RichTextElementContentBody,
} from '@modules/board/controller/dto';
import { CreateCcBoardBodyParams } from '../contorller/common-cartridge-dtos/create-cc-column-board.body.params';
import { BoardExternalReferenceType, BoardLayout, ContentElementType } from '@modules/board';
import { CommonCartridgeXmlResourceType } from '@modules/common-cartridge';
import { CreateCcCardElementBodyParams } from '../contorller/common-cartridge-dtos';
import { AnyContentElement, FileElement, LinkElement, RichTextElement } from '@modules/board/domain';

export class CommonCartridgeImportMappper {
	public mapCommonCartridgeBoardToBoardBodyParams(ccBoard: CreateCcBoardBodyParams): CreateBoardBodyParams {
		const boardDto = new CreateBoardBodyParams();
		boardDto.title = ccBoard.title ?? '';
		boardDto.layout = BoardLayout.COLUMNS;
		boardDto.parentType = BoardExternalReferenceType.Course;
		return boardDto;
	}

	public mapCommonCartridgeElementType(resourceType: CommonCartridgeXmlResourceType): ContentElementType {
		switch (resourceType) {
			case CommonCartridgeXmlResourceType.WEB_CONTENT:
				return ContentElementType.RICH_TEXT;
			case CommonCartridgeXmlResourceType.FILE:
				return ContentElementType.FILE;
			case CommonCartridgeXmlResourceType.WEB_LINK_CC11:
			case CommonCartridgeXmlResourceType.WEB_LINK_CC13:
				return ContentElementType.LINK;
			default:
				throw new Error(`Unknown resource type: ${resourceType}`);
		}
	}

	public mapCommonCartridgeCardElementToAnyElementContent(element: CreateCcCardElementBodyParams): AnyContentElement {
		const { data } = element;
		if (data instanceof RichTextElementContentBody) {
			return this.createRichTextElement(data);
		} else if (data instanceof FileElementContentBody) {
			return this.createFileElement(data);
		} else if (data instanceof LinkElementContentBody) {
			return this.createLinkElement(data);
		} else {
			throw new Error('Method not implemented.');
		}
	}

	public mapContentToAnyElementContentBody(element: CreateCcCardElementBodyParams): AnyElementContentBody {
		const { data } = element;
		switch (element.type) {
			case CommonCartridgeXmlResourceType.WEB_CONTENT:
				return this.createRichTextContentBody(data as unknown as RichTextElementContentBody);
			case CommonCartridgeXmlResourceType.FILE:
				return this.createFileContentBody(data as unknown as FileElementContentBody);
			case CommonCartridgeXmlResourceType.WEB_LINK_CC11:
			case CommonCartridgeXmlResourceType.WEB_LINK_CC13:
				return this.createLinkContentBody(data as unknown as LinkElementContentBody);
			default:
				throw new Error('Method not implemented.');
		}
	}

	private createRichTextContentBody(data: RichTextElementContentBody): RichTextContentBody {
		const text = new RichTextContentBody();
		text.text = data.content.text;
		text.inputFormat = data.content.inputFormat;
		return text;
	}

	private createLinkContentBody(data: LinkElementContentBody): LinkContentBody {
		const link = new LinkContentBody();
		link.title = data.content.title ?? '';
		link.url = data.content.url;
		link.description = data.content.description ?? '';
		link.imageUrl = data.content.imageUrl ?? '';
		link.originalImageUrl = data.content.originalImageUrl ?? '';
		return link;
	}

	private createFileContentBody(data: FileElementContentBody): FileContentBody {
		const file = new FileContentBody();
		file.caption = data.content.caption ?? '';
		file.alternativeText = data.content.alternativeText ?? '';
		return file;
	}

	private createLinkElement(resource: LinkElementContentBody): LinkElement {
		const body = new LinkElement({
			id: '',
			path: '',
			level: 0,
			position: 0,
			title: resource.content.title ?? '',
			url: resource.content.url,
			description: '',
			children: [],
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		return body;
	}

	private createRichTextElement(resource: RichTextElementContentBody): RichTextElement {
		const body = new RichTextElement({
			text: resource.content.text,
			inputFormat: resource.content.inputFormat,
			id: '',
			path: '',
			level: 0,
			position: 0,
			children: [],
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		return body;
	}

	private createFileElement(resource: FileElementContentBody): FileElement {
		const body = new FileElement({
			id: '',
			path: '',
			level: 0,
			position: 0,
			children: [],
			caption: resource.content.caption ?? '',
			alternativeText: resource.content.alternativeText ?? '',
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		return body;
	}
}
