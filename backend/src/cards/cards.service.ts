import { Injectable, NotFoundException } from '@nestjs/common';
import { Category } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateCardInput, UpdateCardInput } from './card.inputs';

export interface CardFilter {
  category?: Category | null;
  spicy?: boolean | null;
}

@Injectable()
export class CardsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(filter: CardFilter = {}) {
    return this.prisma.card.findMany({
      where: {
        ...(filter.category ? { category: filter.category } : {}),
        ...(typeof filter.spicy === 'boolean' ? { spicy: filter.spicy } : {}),
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
  }

  async create(input: CreateCardInput) {
    return this.prisma.card.create({ data: input });
  }

  async update(id: string, input: UpdateCardInput) {
    await this.assertExists(id);
    return this.prisma.card.update({
      where: { id },
      data: {
        ...(input.category ? { category: input.category } : {}),
        ...(input.text !== undefined && input.text !== null ? { text: input.text } : {}),
        ...(typeof input.spicy === 'boolean' ? { spicy: input.spicy } : {}),
      },
    });
  }

  async remove(id: string) {
    await this.assertExists(id);
    return this.prisma.card.delete({ where: { id } });
  }

  private async assertExists(id: string): Promise<void> {
    const card = await this.prisma.card.findUnique({ where: { id }, select: { id: true } });
    if (!card) throw new NotFoundException(`Card "${id}" was not found.`);
  }
}
