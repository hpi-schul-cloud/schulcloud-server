import { Injectable } from '@nestjs/common';
import { PageTypes } from '../interface/page-types.enum';
import { UserMigrationService } from '../service';
import { PageContentDto } from '../service/dto/page-content.dto';

@Injectable()
export class UserMigrationUc {
	constructor(private readonly migrationService: UserMigrationService) {}

	async getPageContent(pageType: PageTypes, sourceSystem: string, targetSystem: string): Promise<PageContentDto> {
		const content: PageContentDto = await this.migrationService.getPageContent(pageType, sourceSystem, targetSystem);

		return content;
	}
}
