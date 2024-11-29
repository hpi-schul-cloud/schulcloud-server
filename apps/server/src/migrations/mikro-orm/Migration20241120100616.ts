import { Migration } from '@mikro-orm/migrations-mongodb';
import { ObjectId } from '@mikro-orm/mongodb';
import { BoardNodeEntity } from '@modules/board/repo';
import { ContextExternalToolEntity } from '@modules/tool/context-external-tool/entity';

export class Migration20241120100616 extends Migration {
	async up(): Promise<void> {
		const tools: ContextExternalToolEntity[] = (await this.driver.find('context-external-tools', {
			$or: [{ contextType: 'course' }, { contextType: 'boardElement' }],
		})) as ContextExternalToolEntity[];
		console.info(`Found ${tools.length} context external tools to look through`);

		let numberOfDeletedTools = 0;
		let numberOfDeletedElements = 0;
		for await (const tool of tools) {
			let iteration = 0;
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
				const schoolOfContext: [{ schoolId: ObjectId }] = (await this.driver.findOne('courses', [
					{ $match: { _id: courseId } },
					{ $project: { item: 1, schoolId: 1, _id: 0 } },
				])) as [{ schoolId: ObjectId }];

				const schoolOfSchoolTool: [{ school: ObjectId }] = (await this.driver.findOne('school-external-tools', [
					{ $match: { _id: tool.schoolTool } },
					{ $project: { item: 1, school: 1, _id: 0 } },
				])) as [{ school: ObjectId }];

				if (
					!schoolOfContext ||
					!schoolOfSchoolTool ||
					schoolOfContext[0].schoolId.toString() !== schoolOfSchoolTool[0].school.toString()
				) {
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

			iteration += 1;
			if (iteration % 100 === 0) {
				console.info(`Finished ${iteration} of ${tools.length} iterations.`);
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
