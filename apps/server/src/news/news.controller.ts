import {
	Controller,
	Get,
	Post,
	Body,
	Patch,
	Param,
	Delete,
	UseInterceptors,
	ClassSerializerInterceptor,
} from '@nestjs/common';
import { NewsService } from './news.service';
import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
import { ApiTags } from '@nestjs/swagger';
import { NewsEntity } from './entities/news.entity';
import { Authenticate, CurrentUser } from '../auth/auth.decorator';
import { ICurrentUser } from '../auth/interfaces/jwt-payload';

@ApiTags('News')
@Authenticate('jwt')
@Controller('news')
@UseInterceptors(ClassSerializerInterceptor)
export class NewsController {
	constructor(private readonly newsService: NewsService) {}

	@Post()
	create(@Body() createNewsDto: CreateNewsDto): Promise<NewsEntity> {
		return this.newsService.create(createNewsDto);
	}

	@Get()
	findAll(@CurrentUser() currentUser: ICurrentUser): Promise<NewsEntity[]> {
		return this.newsService.findAll(currentUser);
	}

	@Get(':id')
	findOne(@Param('id') newsId: string, @CurrentUser() currentUser: ICurrentUser): Promise<Partial<NewsEntity>> {
		const {userId}=currentUser;
		return this.newsService.getByIdForUserId(newsId, userId);
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
