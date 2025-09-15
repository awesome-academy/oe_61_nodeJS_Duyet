import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '@app/database';
import { Repository } from 'typeorm';
import { LIMIT, ListUserDto, PAGE } from '@app/common';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async listUsers(listUserDto: ListUserDto) {
    const { page = PAGE, limit = LIMIT, search } = listUserDto;

    const queryBuilder = this.userRepository.createQueryBuilder('user');

    queryBuilder.select([
      'user.id',
      'user.name',
      'user.email',
      'user.phone',
      'user.avatar',
      'user.status',
      'user.created_at',
      'role.name',
    ]);

    queryBuilder.leftJoin('user.role', 'role');

    if (search) {
      const escapeSearch = search.replace(/[%_]/g, (s) => `\\${s}`);
      queryBuilder.where(
        "(LOWER(user.name) LIKE LOWER(:search) ESCAPE '\\' OR LOWER(user.email) LIKE LOWER(:search) ESCAPE '\\')",
        { search: `%${escapeSearch}%` },
      );
    }

    queryBuilder.skip((page - 1) * limit).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        last_page: Math.ceil(total / limit),
      },
    };
  }
}
