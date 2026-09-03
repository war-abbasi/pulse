import { Controller, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
// `import type`: mongoose's ESM build has no named `Connection` export, so a
// value import fails at runtime. The type is only needed for TypeScript here
// — @InjectConnection() supplies the DI token explicitly.
import type { Connection } from 'mongoose';

/**
 * Liveness endpoint for the hosting platform.
 *
 * Deliberately unauthenticated and free of detail: it reports whether the
 * process is up and whether the database connection is usable, and nothing
 * about versions or configuration that would help someone probing the service.
 */
@Controller('health')
export class HealthController {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  @Get()
  check(): { status: string; database: string } {
    // 1 is "connected" in Mongoose's readyState enum.
    const database = this.connection.readyState === 1 ? 'up' : 'down';
    return { status: 'ok', database };
  }
}
