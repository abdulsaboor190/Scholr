import { Controller, Get } from '@nestjs/common';
import { Public } from './common/decorators';

@Controller()
export class AppController {
  @Public()
  @Get()
  getHello() {
    return {
      name: 'Scholr API',
      version: '1.0.0',
      status: 'online',
      message:
        'Welcome to the Scholr University API! Please use Postman to interact with the specific endpoints (e.g., /api/auth/login).',
    };
  }

  @Public()
  @Get('health')
  healthCheck() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
