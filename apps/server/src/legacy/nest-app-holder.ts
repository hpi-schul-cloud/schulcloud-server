import { INestApplication } from '@nestjs/common';

export class NestAppHolder {
  private static instance: INestApplication;

  private constructor() {
    // singleton
  }

  public static getInstance(): INestApplication {
    return NestAppHolder.instance;
  }

  public static setInstance(app: INestApplication) {
    NestAppHolder.instance = app;
  }
}
