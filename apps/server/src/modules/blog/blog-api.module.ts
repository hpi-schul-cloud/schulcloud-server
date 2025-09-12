import { HttpModule } from '@nestjs/axios';
import { BlogController } from './api/blog.controller';
import { BlogUc } from '@modules/blog/api/blog.uc';
import { Module } from '@nestjs/common';

@Module({
	imports: [HttpModule],
	controllers: [BlogController],
	providers: [BlogUc],
})
export class BlogApiModule {}
