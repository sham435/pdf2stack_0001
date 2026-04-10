import { Controller, Get } from '@nestjs/common';
import { AGENT_NAME } from '@repo/prompt';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return { status: 'ok', agent: AGENT_NAME, timestamp: new Date().toISOString() };
  }
}
