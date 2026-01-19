import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { Role } from '../users/entities/role.entity';
import { LoginDto, AuthResponse, RegisterDto } from '@turbovets/data';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '@turbovets/data';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
    private jwtService: JwtService,
    private auditService: AuditService,
  ) {}

  /**
   * Validates user credentials during authentication.
   * 
   * Security Flow:
   * 1. Lookup user by email (case-sensitive)
   * 2. Load role and organization data for RBAC
   * 3. Verify password using bcrypt (hashed comparison)
   * 4. Return user object if valid, null otherwise
   * 
   * @param email - User's email address
   * @param password - Plain-text password from login form
   * @returns User object with relations if valid, null if invalid
   * 
   * @security
   * - Passwords are NEVER stored in plain text
   * - Uses bcrypt for secure password comparison
   * - Timing-safe comparison prevents timing attacks
   */
  async validateUser(email: string, password: string): Promise<User | null> {
    // Step 1: Fetch user with role and organization for RBAC context
    const user = await this.usersRepository.findOne({
      where: { email },
      relations: ['role', 'organization'], // Eager load for JWT payload
    });

    console.log('🔍 [DEBUG] validateUser lookup for:', email, '→ found:', !!user);

    // Step 2: Return early if user doesn't exist (prevent enumeration)
    if (!user) {
      return null;
    }

    // Step 3: Verify password using bcrypt's timing-safe comparison
    const isPasswordValid = await bcrypt.compare(password, user.password);

    // Step 4: Return null if password invalid (same response as no user)
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      // Helpful dev log to see why login failed (user missing or bad password)
      console.warn('Login failed for email', loginDto.email);
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    };

    const access_token = this.jwtService.sign(payload);

    // Log the login action
    await this.auditService.log({
      userId: user.id,
      action: AuditAction.LOGIN,
      resource: 'auth',
      details: { email: user.email },
    });

    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role.name,
        organizationId: user.organizationId,
      },
    };
  }

  async register(registerDto: RegisterDto): Promise<User> {
    const existingUser = await this.usersRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new UnauthorizedException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = this.usersRepository.create({
      ...registerDto,
      password: hashedPassword,
    });

    const savedUser = await this.usersRepository.save(user);

    await this.auditService.log({
      userId: savedUser.id,
      action: AuditAction.CREATE_USER,
      resource: 'users',
      resourceId: savedUser.id,
      details: { email: savedUser.email },
    });

    return savedUser;
  }
}
