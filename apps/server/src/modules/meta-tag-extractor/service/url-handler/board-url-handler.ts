import { ObjectId } from '@mikro-orm/mongodb';
import { BoardExternalReferenceType, BoardNodeService, Card, ColumnBoard } from '@modules/board';
import { CourseDoService } from '@modules/course';
import { Injectable } from '@nestjs/common';
import type { UrlHandler } from '../../interface/url-handler';
import { MetaData, MetaDataEntityType } from '../../types';
import { AbstractUrlHandler } from './abstract-url-handler';

@Injectable()
export class BoardUrlHandler extends AbstractUrlHandler implements UrlHandler {
	protected override patterns: RegExp[] = [/^\/boards\/([0-9a-f]{24})$/i];

	constructor(private readonly boardNodeService: BoardNodeService, private readonly courseService: CourseDoService) {
		super();
	}

	public async getMetaData(url: URL): Promise<MetaData | undefined> {
		const id: string | undefined = this.extractId(url);
		if (id === undefined) {
			return undefined;
		}

		const columnBoard: ColumnBoard = await this.boardNodeService.findByClassAndId(ColumnBoard, id);

		let partialMetaData: Partial<MetaData>;
		if (url.hash) {
			const hash: string = url.hash.slice(1);

			partialMetaData = await this.getHashMetaData(columnBoard, hash);
		} else {
			partialMetaData = await this.getBoardMetaData(columnBoard);
		}

		const metaData: MetaData = this.getDefaultMetaData(url, partialMetaData);

		return metaData;
	}

	private async getBoardMetaData(columnBoard: ColumnBoard): Promise<Partial<MetaData>> {
		const metaData: Partial<MetaData> = {
			type: MetaDataEntityType.BOARD,
			title: columnBoard.title,
		};

		switch (columnBoard.context.type) {
			case BoardExternalReferenceType.Course: {
				const course = await this.courseService.findById(columnBoard.context.id);

				metaData.parentType = MetaDataEntityType.COURSE;
				metaData.parentTitle = course.name;
				break;
			}
			default:
				break;
		}

		return metaData;
	}

	private async getHashMetaData(columnBoard: ColumnBoard, hash: string): Promise<Partial<MetaData>> {
		const [hashType, hashId] = hash.split('-');

		if (ObjectId.isValid(hashId)) {
			switch (hashType) {
				case 'card': {
					const card: Card = await this.boardNodeService.findByClassAndId(Card, hashId);

					return {
						title: card.title ?? '-',
						type: MetaDataEntityType.BOARD_CARD,
					};
				}
				default:
					break;
			}
		}

		return this.getBoardMetaData(columnBoard);
	}
}
