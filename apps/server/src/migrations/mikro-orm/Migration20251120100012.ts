import { Migration } from '@mikro-orm/migrations-mongodb';
import { ObjectId } from '@mikro-orm/mongodb';

/*
 * Migration removing materials and lesson contents referencing merlin.
 * The class is used dynamically by Mikro-ORM even if eslint/ts cannot detect direct usage.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class Migration20251120100012 extends Migration {
	// Document type helpers
	private readonly materialsCollection = this.getCollection('materials');
	private readonly lessonsCollection = this.getCollection('lessons');

	private isNonEmptyMerlin(ref: unknown): ref is string {
		return typeof ref === 'string' && ref.trim() !== '';
	}

	public async up(): Promise<void> {
		await this.removeMaterialsWithMerlin();
		await this.removeLessonMerlinReferences();
	}

	private async removeMaterialsWithMerlin(): Promise<void> {
		// Find materials having a non-empty merlinReference
		const materialsRaw = (await this.materialsCollection
			.find({ merlinReference: { $exists: true, $ne: '' } })
			.project({ _id: 1 })
			.toArray()) as Array<{ _id: unknown }>;

		const materialIds: ObjectId[] = materialsRaw.map((doc) => doc._id as ObjectId);
		if (materialIds.length === 0) {
			console.info('No materials with merlinReference found. No references removed from lessons.');
			return;
		}

		// Remove references to these materials from lessons.materialIds arrays
		const deleteMaterialReferences = await this.lessonsCollection.updateMany({ materialIds: { $in: materialIds } }, {
			$pull: { materialIds: { $in: materialIds } },
		} as Record<string, unknown>);

		console.info(
			'Removed references to materials with merlinReference from lessons:',
			deleteMaterialReferences.modifiedCount
		);

		const deleteMaterials = await this.materialsCollection.deleteMany({ _id: { $in: materialIds } });
		console.info('Deleted materials with merlinReference:', deleteMaterials.deletedCount);
	}

	private async removeLessonMerlinReferences(): Promise<void> {
		interface LessonContentResource {
			merlinReference?: string;
		}
		interface LessonContent {
			_id?: ObjectId;
			component?: string;
			content?: { resources?: LessonContentResource[]; [key: string]: unknown };
		}
		interface LessonDoc {
			_id: ObjectId;
			contents?: LessonContent[];
		}

		const cursor = this.lessonsCollection
			.find({ 'contents.content.resources.merlinReference': { $exists: true, $ne: '' } })
			.project({ _id: 1, contents: 1 });

		let modifiedLessons = 0;
		while (await cursor.hasNext()) {
			const raw = await cursor.next();
			if (!raw) break;
			const lesson = raw as LessonDoc;
			const originalContents: LessonContent[] = Array.isArray(lesson.contents) ? lesson.contents : [];
			const filteredContents = originalContents.filter((c) => {
				const resources = c.content?.resources;
				if (!Array.isArray(resources) || resources.length === 0) return true;
				// Keep content only if ALL resources have empty / missing merlinReference
				return !resources.some((r) => this.isNonEmptyMerlin(r.merlinReference));
			});
			if (filteredContents.length !== originalContents.length) {
				await this.lessonsCollection.updateOne({ _id: lesson._id }, { $set: { contents: filteredContents } });
				modifiedLessons += 1;
			}
		}
		console.info('Removed merlinReference contents from lessons. Lessons modified:', modifiedLessons);
	}

	public async down(): Promise<void> {
		// Irreversible migration - intentionally left blank
	}
}

// Ensure the class identifier is referenced so TS does not flag it as unused (used reflectively by Mikro-ORM)
void Migration20251120100012;
