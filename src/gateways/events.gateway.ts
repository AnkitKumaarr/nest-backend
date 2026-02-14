import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Global, Logger } from '@nestjs/common';

@Global()
@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:3000' },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  private readonly logger = new Logger(EventsGateway.name);

  private userSockets = new Map<string, string>();

  constructor(private jwtService: JwtService) {}

  // async handleConnection(client: Socket) {
  //   try {
  //     const token = client.handshake.auth.token;
  //     if (!token) return client.disconnect();

  //     const payload = await this.jwtService.verifyAsync(token);
  //     const userId = payload.sub;
  //     const orgId = payload.orgId;

  //     // Map user to socket for private notifications
  //     this.userSockets.set(userId, client.id);

  //     // Only join an Org Room if the user actually belongs to one
  //     if (orgId) {
  //       client.join(orgId);
  //     }
  //   } catch (e) {
  //     client.disconnect();
  //   }
  // }

  async handleConnection(client: Socket) {
    try {
      // 1. Extract token from auth object (best practice) or headers
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        this.logger.error('No token provided');
        client.disconnect();
        return;
      }

      // 2. Verify JWT
      const payload = await this.jwtService.verifyAsync(token);
      
      // 3. Attach metadata to the client object for easy access later
      client.data.userId = payload.sub;
      client.data.orgId = payload.companyId; // Match your Prisma field name

      // 4. Join Private Room (User ID) and Org Room
      // This eliminates the need for a manual userSockets Map
      await client.join(`user_${payload.sub}`);
      
      if (payload.companyId) {
        await client.join(`org_${payload.companyId}`);
      }

      this.logger.log(`User connected: ${payload.sub} in Org: ${payload.companyId}`);
    } catch (e) {
      this.logger.error('Connection unauthorized');
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    for (const [userId, socketId] of this.userSockets.entries()) {
      if (socketId === client.id) {
        this.userSockets.delete(userId);
        break;
      }
    }
  }

  // Send to one specific person (e.g., "You were assigned a task")
  sendToUser(userId: string, event: string, data: any) {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.server.to(socketId).emit(event, data);
    }
  }

  // Send to everyone in the company (e.g., "A new meeting was scheduled")
  sendToOrg(orgId: string | null, event: string, data: any) {
    if (orgId) {
      this.server.to(orgId).emit(event, data);
    }
  }
}