import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { StrategyType } from '../interface';

@Injectable()
export class MetaTagExtractorXApiKeyGuard extends AuthGuard(StrategyType.METATAG_EXTRACTOR_API_KEY) {}
