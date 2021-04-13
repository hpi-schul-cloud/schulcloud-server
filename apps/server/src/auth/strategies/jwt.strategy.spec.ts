import { Test, TestingModule } from '@nestjs/testing';
import { Jwt.StrategyService } from './jwt.strategy';

describe('Jwt.StrategyService', () => {
  let service: Jwt.StrategyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [Jwt.StrategyService],
    }).compile();

    service = module.get<Jwt.StrategyService>(Jwt.StrategyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
