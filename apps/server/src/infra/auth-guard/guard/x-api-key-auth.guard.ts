import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { StrategyType } from '../interface';

@Injectable()
export class XApiKeyGuard extends AuthGuard(StrategyType.API_KEY) {}
