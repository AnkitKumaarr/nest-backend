import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generate fullName from firstName and lastName
   */
  private generateFullName(firstName: string, lastName?: string): string {
    return lastName ? `${firstName} ${lastName}` : firstName;
  }

  async create(createUserDto: CreateUserDto) {
    return this.prisma.user.create({
      data: {
        ...createUserDto,
        lastName: createUserDto.lastName || null,
        fullName: this.generateFullName(createUserDto.firstName, createUserDto.lastName),
      },
    });
  }

  async findAll() {
    return this.prisma.user.findMany();
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const updateData: any = { ...updateUserDto };
    
    // If firstName or lastName is being updated, regenerate fullName
    if (updateUserDto.firstName || updateUserDto.lastName) {
      const currentUser = await this.prisma.user.findUnique({ where: { id } });
      if (!currentUser) throw new NotFoundException(`User with ID ${id} not found`);
      
      const firstName = updateUserDto.firstName || currentUser.firstName;
      const lastName = updateUserDto.lastName !== undefined ? updateUserDto.lastName : currentUser.lastName;
      updateData.fullName = this.generateFullName(firstName, lastName || undefined);
    }
    
    return this.prisma.user.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string) {
    return this.prisma.user.delete({
      where: { id },
    });
  }
}
