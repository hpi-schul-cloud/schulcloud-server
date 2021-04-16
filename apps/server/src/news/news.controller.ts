import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { NewsService } from './news.service';
import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
import { ApiTags } from '@nestjs/swagger';
import { NewsEntity } from './entities/news.entity';
import { Authenticate } from '../auth/auth.decorator';

@ApiTags('News')
@Authenticate('jwt')
@Controller('news')
export class NewsController {
	constructor(private readonly newsService: NewsService) {}

	@Post()
	create(@Body() createNewsDto: CreateNewsDto): Promise<NewsEntity> {
		return this.newsService.create(createNewsDto);
	}

	@Get()
	findAll(): Promise<NewsEntity[]> {
		return this.newsService.findAll();
	}

	@Get(':id')
	findOne(@Param('id') id: string): Promise<NewsEntity> {
		return this.newsService.findOne(id);
	}

	@Patch(':id')
	update(@Param('id') id: string, @Body() updateNewsDto: UpdateNewsDto) {
		return this.newsService.update(id, updateNewsDto);
	}

	@Delete(':id')
	remove(@Param('id') id: string): Promise<string> {
		return this.newsService.remove(id);
	}
}
