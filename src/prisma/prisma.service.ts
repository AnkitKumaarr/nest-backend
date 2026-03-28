import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
    console.log("✅ Prisma connected to MongoDB");
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }
}

/** Use this type to annotate `tx` inside $transaction callbacks */
export type PrismaTxClient = Omit<
  PrismaService,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;
