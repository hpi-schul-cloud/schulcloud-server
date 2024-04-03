import { ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { type AnyBoardDo, ColumnInitProps, MediaBoard, MediaLine } from '@shared/domain/domainobject';
import { EntityId } from '@shared/domain/types';
import { BoardDoRepo } from '../../repo';
import { BoardDoService } from '../board-do.service';

@Injectable()
export class MediaLineService {
	constructor(private readonly boardDoRepo: BoardDoRepo, private readonly boardDoService: BoardDoService) {}

	public async findById(lineId: EntityId): Promise<MediaLine> {
		const line: MediaLine = await this.boardDoRepo.findByClassAndId(MediaLine, lineId);

		return line;
	}

	public async create(parent: MediaBoard, props?: ColumnInitProps): Promise<MediaLine> {
		const line: MediaLine = new MediaLine({
			id: new ObjectId().toHexString(),
			title: props?.title,
			children: [],
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		parent.addChild(line);

		await this.boardDoRepo.save(parent.children, parent);

		return line;
	}

	public async delete(line: MediaLine): Promise<void> {
		await this.boardDoService.deleteWithDescendants(line);
	}

	public async move(line: MediaLine, targetBoard: MediaBoard, targetPosition?: number): Promise<void> {
		await this.boardDoService.move(line, targetBoard, targetPosition);
	}

	public async updateTitle(line: MediaLine, title: string): Promise<void> {
		const parent: AnyBoardDo | undefined = await this.boardDoRepo.findParentOfId(line.id);

		line.title = title;

		await this.boardDoRepo.save(line, parent);
	}
}
