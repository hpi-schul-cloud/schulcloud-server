import {
	AnyElementContentBody,
	FileContentBody,
	FileElementContentBody,
	LinkContentBody,
	LinkElementContentBody,
	RichTextContentBody,
	RichTextElementContentBody,
} from '@modules/board/controller/dto';
import { ContentElementType } from '@modules/board';
import { CommonCartridgeXmlResourceType } from '@modules/common-cartridge';
import { CreateCcCardElementBodyParams } from '../contorller/common-cartridge-dtos';
import { AnyContentElement, FileElement, LinkElement, RichTextElement } from '@modules/board/domain';

export class CommonCartridgeImportMappper {
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

	public mapCommonCartridgeCardElementToAnyElementContent(
		element: CreateCcCardElementBodyParams
	): AnyContentElement | undefined {
		if (!element.data) return;
		if (element.type === CommonCartridgeXmlResourceType.WEB_CONTENT) {
			return this.createRichTextElement(element.data.data as RichTextElementContentBody);
		} else if (element.type === CommonCartridgeXmlResourceType.FILE) {
			return this.createFileElement(element.data.data as FileElementContentBody);
		} else if (
			element.type === CommonCartridgeXmlResourceType.WEB_LINK_CC11 ||
			element.type === CommonCartridgeXmlResourceType.WEB_LINK_CC13
		) {
			return this.createLinkElement(element.data.data as LinkElementContentBody);
		}
		throw new Error(`Unsupported element type: ${element.type}`);
	}

	public mapContentToAnyElementContentBody(element: CreateCcCardElementBodyParams): AnyElementContentBody {
		switch (element.type) {
			case CommonCartridgeXmlResourceType.WEB_CONTENT:
				return this.createRichTextContentBody(element.data?.data as RichTextElementContentBody);
			case CommonCartridgeXmlResourceType.FILE:
				return this.createFileContentBody(element.data?.data as FileElementContentBody);
			case CommonCartridgeXmlResourceType.WEB_LINK_CC11:
			case CommonCartridgeXmlResourceType.WEB_LINK_CC13:
				return this.createLinkContentBody(element.data?.data as LinkElementContentBody);
			default:
				throw new Error('Unsupported element type');
		}
	}

	private createRichTextContentBody(data: RichTextElementContentBody): AnyElementContentBody {
		const text = new RichTextContentBody();
		text.text = data.content.text;
		text.inputFormat = data.content.inputFormat;
		return text;
	}

	private createLinkContentBody(data: LinkElementContentBody): AnyElementContentBody {
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
