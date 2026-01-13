import { Global, Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { JwtModule } from '@nestjs/jwt';

@Global() // Makes the module global
@Module({
  imports: [JwtModule], // Ensure JwtModule is available for the Gateway
  providers: [EventsGateway],
  exports: [EventsGateway], // Export it so other services can use it
})
export class EventsModule {}