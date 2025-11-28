import { Migration } from '@mikro-orm/migrations-mongodb';
import { ObjectId } from '@mikro-orm/mongodb';

/*
 * Migration removing materials and lesson contents referencing merlin.
 */
export class Migration20251120100012 extends Migration {
	private readonly materialsCollection = this.getCollection('materials');
	private readonly lessonsCollection = this.getCollection('lessons');

	private isNonEmptyMerlin(ref: unknown): ref is string {
		return typeof ref === 'string' && ref.trim() !== '';
	}

	private isMerlinUrl(url: unknown): boolean {
		if (typeof url !== 'string') return false;
		const merlinPatterns = [/http:\/\/merlin.nibis.de\/auth.php/, /live.download.nibis.de/];
		return merlinPatterns.some((pattern) => pattern.test(url));
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
			.toArray()) as Array<{ _id: ObjectId }>;

		const materialIds: ObjectId[] = materialsRaw.map((doc) => doc._id);
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
			url?: string;
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
			.find({
				$or: [
					{ 'contents.content.resources.merlinReference': { $exists: true, $ne: '' } },
					{ 'contents.content.resources.url': /http:\/\/merlin.nibis.de\/auth.php/ },
					{ 'contents.content.resources.url': /live.download.nibis.de/ },
				],
			})
			.project({ _id: 1, contents: 1 });

		let modifiedLessons = 0;
		while (await cursor.hasNext()) {
			const rawDocument = await cursor.next();
			if (!rawDocument) break;
			const lesson = rawDocument as LessonDoc;

			const { contents } = lesson;
			if (!Array.isArray(contents) || contents.length === 0) continue;

			for (const item of contents) {
				if (item.component !== 'resources' || !item.content || typeof item.content !== 'object') continue;
				const { resources } = item.content;
				if (!Array.isArray(resources) || resources.length === 0) continue;

				for (let i = resources.length - 1; i >= 0; i--) {
					if (this.isNonEmptyMerlin(resources[i].merlinReference) || this.isMerlinUrl(resources[i].url)) {
						resources.splice(i, 1);
					} else {
						// Remove merlinReference if present but empty
						if ('merlinReference' in resources[i]) {
							delete resources[i].merlinReference;
						}
					}
				}
			}

			await this.lessonsCollection.updateOne({ _id: lesson._id }, { $set: { contents } });
			modifiedLessons += 1;
		}
		console.info('Removed merlinReference contents from lessons. Lessons modified:', modifiedLessons);
	}

	public async down(): Promise<void> {
		// Irreversible migration - intentionally left blank
	}
}

// Ensure the class identifier is referenced so TS does not flag it as unused (used reflectively by Mikro-ORM)
void Migration20251120100012;
