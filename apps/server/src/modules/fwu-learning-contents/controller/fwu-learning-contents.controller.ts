import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { JwtAuthentication } from '@infra/auth-guard';
import {
	Controller,
	Get,
	HttpStatus,
	InternalServerErrorException,
	Param,
	Req,
	Res,
	StreamableFile,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { FwuLearningContentsUc } from '../uc/fwu-learning-contents.uc';
import { GetFwuLearningContentParams } from './dto/fwu-learning-contents.params';

@ApiTags('fwu')
@JwtAuthentication()
@Controller('fwu')
export class FwuLearningContentsController {
	constructor(private readonly fwuLearningContentsUc: FwuLearningContentsUc) {}

	@Get('*/:fwuLearningContent')
	public async get(
		@Req() req: Request,
		@Res({ passthrough: true }) res: Response,
		@Param() params: GetFwuLearningContentParams
	): Promise<StreamableFile> {
		if (!Configuration.get('FEATURE_FWU_CONTENT_ENABLED')) {
			throw new InternalServerErrorException('Feature FWU content is not enabled.');
		}
		const bytesRange = req.header('Range');
		const path = `${req.params[0]}/${params.fwuLearningContent}`;
		const response = await this.fwuLearningContentsUc.get(path, bytesRange);

		if (bytesRange) {
			res.set({
				'Accept-Ranges': 'bytes',
				'Content-Range': response.contentRange,
			});

			res.status(HttpStatus.PARTIAL_CONTENT);
		} else {
			res.status(HttpStatus.OK);
		}

		req.on('close', () => response.data.destroy());

		return new StreamableFile(response.data, {
			type: response.contentType,
			disposition: `inline; filename="${encodeURI(params.fwuLearningContent)}"`,
			length: response.contentLength,
		});
	}

	@Get()
	public getList() {
		if (!Configuration.get('FEATURE_FWU_CONTENT_ENABLED')) {
			throw new InternalServerErrorException('Feature FWU content is not enabled.');
		}

		type fwu = {
			id: string;
			title: string;
			target_url: string;
			thumbnail_url: string;
		};
		const list: fwu[] = [
			{
				id: '5501458',
				title: 'Nachhaltig Bauen: Gebäudeaufbau',
				thumbnail_url: '/api/v3/fwu//5501458/bild/Intro_550485864772_thumb_1024x576.jpg',
				target_url: '/api/v3/5501458/index.html',
			},
			{
				id: '5501191',
				title: 'Parteien in Deutschland',
				thumbnail_url: 'api/v3/fwu/5501191/bild/16318234647710_thumb_1024x576.jpg',
				target_url: '/api/v3/fwu/5501191/index.html',
			},
			{
				id: '5501202',
				title: 'Singapur - Global City und Tigerstaat',
				thumbnail_url: '/api/v3/fwu/5501202/bild/16004192831233_thumb_1024x576.jpg',
				target_url: '/api/v3/fwu/5501202/index.html',
			},
			{
				id: '5501238',
				title: 'Teen Life in Britain',
				thumbnail_url: '/api/v3/fwu/5501238/index.html',
				target_url: '/api/v3/fwu/5501202/bild/16004192831233_thumb_1024x576.jpg',
			},
			{
				id: '5501252',
				title: 'Lesen macht Spaß!',
				thumbnail_url: '/api/v3/fwu/5501252/bild/15768955843249_thumb_1024x576.jpg',
				target_url: '/api/v3/fwu/5501252/index.html',
			},
			{
				id: '5501588',
				title: 'Checker Can: Der Hygiene-Check',
				thumbnail_url: '/api/v3/fwu/5501588/bild/Intro_550158864927_thumb_1024x576.jpg',
				target_url: '/api/v3/fwu/5501588/index.html',
			},
			{
				id: '5511004',
				title: 'Checker Can: Der Handicap-Check',
				thumbnail_url: '/api/v3/fwu/5511004/bild/titelbild28945_thumb_1024x576.jpg',
				target_url: '/api/v3/fwu/5511004/index.html',
			},
			{
				id: '5511106',
				title: 'Das Grundgesetz - Basis der deutschen Demokratie',
				thumbnail_url: '/api/v3/fwu/5511106/bild/Cover_Fotolia_4668116374672_thumb_1024x576.jpg',
				target_url: '/api/v3/fwu/5511106/index.html',
			},
			{
				id: '5521354',
				title: 'Big Data (interaktiv)',
				thumbnail_url: '/api/v3/fwu/5521354/bild/cover113313_thumb_1024x576.jpg',
				target_url: '/api/v3/5521354/index.html',
			},
			{
				id: '5521413',
				title: 'Kommunalpolitik (interaktiv)',
				thumbnail_url: '/api/v3/fwu/5521413/bild/Cover135395_thumb_1024x576.jpg',
				target_url: '/api/v3/5521413/index.html',
			},
		];
		return list;
	}
}
