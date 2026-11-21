import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { SubmitCardInput } from './submission.inputs';

/** Stops a flood of guest cards from growing the deck without limit. */
export const MAX_DECK_SIZE = 600;

const normalise = (text: string): string => text.normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim();

@Injectable()
export class SubmissionsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Adds a guest's card straight to the deck. The host can delete anything from /admin. */
  async submit(input: SubmitCardInput): Promise<void> {
    const key = normalise(input.text);
    const cards = await this.prisma.card.findMany({ select: { text: true } });
    if (cards.some((card) => normalise(card.text) === key)) {
      throw new BadRequestException('That card is already in the deck!');
    }
    if (cards.length >= MAX_DECK_SIZE) {
      throw new BadRequestException('The deck is full. Grab the host!');
    }
    await this.prisma.card.create({
      data: { category: input.category, text: input.text, spicy: input.spicy },
    });
  }
}
