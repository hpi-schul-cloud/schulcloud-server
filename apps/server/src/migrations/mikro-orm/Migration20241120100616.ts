import { Migration } from '@mikro-orm/migrations-mongodb';
import { ObjectId } from '@mikro-orm/mongodb';
import { type BoardNodeEntity } from '@modules/board/repo';
import { type ContextExternalToolEntity, ContextExternalToolType } from '@modules/tool/context-external-tool/entity';
import { type SchoolExternalToolEntity } from '@modules/tool/school-external-tool/entity';
import { type Course } from '@shared/domain/entity';

export class Migration20241120100616 extends Migration {
	async up(): Promise<void> {
		const cursor = this.getCollection<ContextExternalToolEntity>('context-external-tools').find({
			$or: [{ contextType: ContextExternalToolType.COURSE }, { contextType: ContextExternalToolType.BOARD_ELEMENT }],
		});

		let numberOfDeletedTools = 0;
		let numberOfDeletedElements = 0;
		for await (const tool of cursor) {
			let courseId: ObjectId | undefined;
			if (tool.contextType === 'course') {
				courseId = tool.contextId;
			} else if (tool.contextType === 'boardElement') {
				const element: BoardNodeEntity | null = (await this.driver.findOne('boardnodes', {
					_id: tool.contextId,
				})) as BoardNodeEntity | null;

				if (element) {
					const boardId = new ObjectId(element.path.split(',')[1]);

					const board: BoardNodeEntity | null = (await this.driver.findOne('boardnodes', {
						_id: boardId,
					})) as BoardNodeEntity | null;

					if (board) {
						courseId = board.context as unknown as ObjectId;
					}
				}
			}

			if (courseId) {
				const course: Course = (await this.driver.findOne('courses', { _id: courseId })) as Course;

				const schoolTool: SchoolExternalToolEntity = (await this.driver.findOne('school-external-tools', {
					_id: tool.schoolTool,
				})) as SchoolExternalToolEntity;

				if (!course || !schoolTool || course.school.toString() !== schoolTool.school.toString()) {
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

	// eslint-disable-next-line @typescript-eslint/require-await
	async down(): Promise<void> {
		console.info('Unfortunately the deleted documents cannot be restored. Use a backup.');
	}
}
