import { Migration } from '@mikro-orm/migrations-mongodb';
import { ObjectId } from '@mikro-orm/mongodb';

export class Migration20241120100616 extends Migration {
	public async up(): Promise<void> {
		const cursor = this.getCollection<{ contextType: string; contextId: ObjectId; schoolTool: ObjectId }>(
			'context-external-tools'
		).find({
			$or: [{ contextType: 'course' }, { contextType: 'boardElement' }],
		});

		let numberOfDeletedTools = 0;
		let numberOfDeletedElements = 0;
		for await (const tool of cursor) {
			let courseId: ObjectId | undefined;
			if (tool.contextType === 'course') {
				courseId = tool.contextId;
			} else if (tool.contextType === 'boardElement') {
				const element = await this.getCollection<{ _id: ObjectId; path: string }>('boardnodes').findOne({
					_id: tool.contextId,
				});

				if (element) {
					const boardId = new ObjectId(element.path.split(',')[1]);

					const board = await this.getCollection<{ _id: ObjectId; context: ObjectId }>('boardnodes').findOne({
						_id: boardId,
					});

					if (board) {
						courseId = board.context;
					}
				}
			}

			if (courseId) {
				const course = await this.getCollection<{ _id: ObjectId; schoolId: ObjectId }>('courses').findOne({
					_id: courseId,
				});

				const schoolTool = await this.getCollection<{ _id: ObjectId; school: ObjectId }>(
					'school-external-tools'
				).findOne({
					_id: tool.schoolTool,
				});

				if (!course || !schoolTool || course.schoolId.toString() !== schoolTool.school.toString()) {
					await this.driver.nativeDelete('context-external-tools', { _id: tool._id });
					console.info(`deleted context external tool: ${tool._id.toString()}`);
					numberOfDeletedTools += 1;
					if (tool.contextType === 'boardElement') {
						await this.driver.nativeDelete('boardnodes', { _id: tool.contextId });
						// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
						console.info(`deleted boardnode: ${tool.contextId}`);
						numberOfDeletedElements += 1;
					}
				}
			}
		}
		console.info(
			`Deleted ${numberOfDeletedTools} context external tools and ${numberOfDeletedElements} external tool elements.`
		);
	}

	// eslint-disable-next-line @typescript-eslint/require-await, require-await
	public async down(): Promise<void> {
		console.info('Unfortunately the deleted documents cannot be restored. Use a backup.');
	}
}
