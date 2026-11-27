import { type EntityData } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { type BoardImportCheckpoint, BoardImportJob, type BoardImportNote } from '../../domain';
import { BoardImportCheckpointEmbeddable, type BoardImportJobEntity, BoardImportNoteEmbeddable } from '../entity';

export class BoardImportJobMapper {
	public static mapEntityToDO(entity: BoardImportJobEntity): BoardImportJob {
		const domainObject = new BoardImportJob({
			id: entity.id,
			status: entity.status,
			userId: entity.userId.toHexString(),
			source: { type: entity.sourceType, link: entity.link },
			target: { type: entity.targetType, id: entity.targetId.toHexString() },
			expiresAt: entity.expiresAt,
			// A job that was stored without a counter has had no attempt.
			attempts: entity.attempts ?? 0,
			startedAt: entity.startedAt,
			boardId: entity.boardId?.toHexString(),
			notes: (entity.notes ?? []).map((note) => BoardImportJobMapper.mapNoteToDO(note)),
			failureReason: entity.failureReason,
			plan: entity.plan,
			checkpoints: (entity.checkpoints ?? []).map((checkpoint) => BoardImportJobMapper.mapCheckpointToDO(checkpoint)),
		});

		return domainObject;
	}

	public static mapDOToEntityProperties(domainObject: BoardImportJob): EntityData<BoardImportJobEntity> {
		const props: EntityData<BoardImportJobEntity> = {
			status: domainObject.status,
			userId: new ObjectId(domainObject.userId),
			link: domainObject.source.link,
			sourceType: domainObject.source.type,
			targetType: domainObject.target.type,
			targetId: new ObjectId(domainObject.target.id),
			expiresAt: domainObject.expiresAt,
			attempts: domainObject.attempts,
			startedAt: domainObject.startedAt,
			boardId: domainObject.boardId ? new ObjectId(domainObject.boardId) : undefined,
			notes: domainObject.notes.map((note) => new BoardImportNoteEmbeddable(note)),
			failureReason: domainObject.failureReason,
			plan: domainObject.plan,
			checkpoints: domainObject.checkpoints.map((checkpoint) =>
				BoardImportJobMapper.mapCheckpointToEmbeddable(checkpoint)
			),
		};

		return props;
	}

	public static mapCheckpointToEmbeddable(checkpoint: BoardImportCheckpoint): BoardImportCheckpointEmbeddable {
		const embeddable = new BoardImportCheckpointEmbeddable({
			columnId: new ObjectId(checkpoint.columnId),
			cardIds: checkpoint.cardIds.map((cardId) => new ObjectId(cardId)),
		});

		return embeddable;
	}

	private static mapCheckpointToDO(checkpoint: BoardImportCheckpointEmbeddable): BoardImportCheckpoint {
		const domainCheckpoint: BoardImportCheckpoint = {
			columnId: checkpoint.columnId.toHexString(),
			cardIds: checkpoint.cardIds.map((cardId) => cardId.toHexString()),
		};

		return domainCheckpoint;
	}

	private static mapNoteToDO(note: BoardImportNoteEmbeddable): BoardImportNote {
		const domainNote: BoardImportNote = {
			type: note.type,
			sectionTitle: note.sectionTitle,
			cardTitle: note.cardTitle,
			elementType: note.elementType,
			elementKind: note.elementKind,
		};

		return domainNote;
	}
}
