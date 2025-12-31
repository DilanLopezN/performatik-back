import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';

import { Prisma, PrismaClient } from '@prisma/client';

type PrismaDelegateWithDeleteMany = {
  deleteMany: (args?: unknown) => Promise<unknown>;
};

function hasDeleteMany(x: unknown): x is PrismaDelegateWithDeleteMany {
  return (
    !!x &&
    typeof x === 'object' &&
    'deleteMany' in x &&
    typeof (x as any).deleteMany === 'function'
  );
}

@Injectable()
export class PrismaService
  extends PrismaClient<Prisma.PrismaClientOptions, 'query' | 'error'>
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'stdout', level: 'info' },
        { emit: 'stdout', level: 'warn' },
      ],
    });
  }

  async onModuleInit() {
    if (process.env.NODE_ENV === 'development') {
      this.$on('query', (event) => {
        this.logger.debug(`Query: ${event.query}`);
        this.logger.debug(`Duration: ${event.duration}ms`);
      });
    }

    this.$on('error', (event) => {
      this.logger.error(`Prisma Error: ${event.message}`);
    });

    await this.$connect();
    this.logger.log('✅ Database connected successfully');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Database disconnected');
  }

  async executeTransaction<T>(
    fn: (prisma: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.$transaction(fn);
  }

  async cleanDatabase() {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('cleanDatabase can only be used in test environment');
    }

    // Prisma.ModelName é o enum/string union oficial dos models gerados
    const modelNames = Object.values(Prisma.ModelName);

    // Em geral você quer rodar em transação; e em alguns bancos precisa limpar na ordem certa.
    // Aqui vai o simples (se tiver FK, pode precisar ajustar ordem / cascade).
    await this.$transaction(async (tx) => {
      await Promise.all(
        modelNames.map((name) => {
          const delegate = (tx as Record<string, unknown>)[name];
          if (hasDeleteMany(delegate)) return delegate.deleteMany();
          return Promise.resolve();
        }),
      );
    });
  }
}
