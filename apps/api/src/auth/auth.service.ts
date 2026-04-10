import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async validateUser(email: string, pass: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException();
    const ok = await bcrypt.compare(pass, user.passwordHash);
    if (!ok) throw new UnauthorizedException();
    const { passwordHash, ...result } = user;
    return result;
  }

  async register(email: string, password: string) {
    const hash = await bcrypt.hash(password, 10);
    return this.prisma.user.create({ data: { email, passwordHash: hash } });
  }
}
