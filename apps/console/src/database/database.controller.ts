import { Controller, Post } from '@nestjs/common';
import { DatabaseService } from './database.service';

@Controller('database')
export class DatabaseController {
	constructor(private databaseService: DatabaseService) {}

	@Post()
	async seedDatabase(): Promise<string> {
		const result = await this.databaseService.seedDatabase();
		return result;
	}
}
