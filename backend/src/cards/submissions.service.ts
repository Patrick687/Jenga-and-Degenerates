import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { SubmissionStatus } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import type { UpdateCardInput } from './card.inputs';
import type { SubmitCardInput } from './submission.inputs';

/** How many suggestions can wait for the host before the box is "full". */
export const MAX_PENDING = 300;

const normalise = (text: string): string => text.normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim();

@Injectable()
export class SubmissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async submit(input: SubmitCardInput): Promise<void> {
    const key = normalise(input.text);
    const [cards, pending] = await Promise.all([
      this.prisma.card.findMany({ select: { text: true } }),
      this.prisma.cardSubmission.findMany({
        where: { status: SubmissionStatus.PENDING },
        select: { text: true },
      }),
    ]);
    if (cards.some((card) => normalise(card.text) === key)) {
      throw new BadRequestException('That card is already in the deck!');
    }
    if (pending.some((submission) => normalise(submission.text) === key)) {
      throw new BadRequestException('Someone already suggested that one. Great minds!');
    }
    if (pending.length >= MAX_PENDING) {
      throw new BadRequestException('The suggestion box is full. Grab the host!');
    }

    await this.prisma.cardSubmission.create({
      data: {
        category: input.category,
        text: input.text,
        spicy: input.spicy,
        submittedBy: input.submittedBy?.trim() ? input.submittedBy.trim() : null,
      },
    });
  }

  listPending() {
    return this.prisma.cardSubmission.findMany({
      where: { status: SubmissionStatus.PENDING },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
  }

  /** Turns a suggestion into a real card. The host may fix the wording first. */
  async approve(id: string, edits?: UpdateCardInput | null) {
    return this.prisma.$transaction(async (tx) => {
      const submission = await this.requirePending(tx, id);
      const card = await tx.card.create({
        data: {
          category: edits?.category ?? submission.category,
          text: edits?.text ?? submission.text,
          spicy: edits?.spicy ?? submission.spicy,
        },
      });
      await tx.cardSubmission.update({
        where: { id },
        data: { status: SubmissionStatus.APPROVED, decidedAt: new Date() },
      });
      return card;
    });
  }

  async reject(id: string) {
    return this.prisma.$transaction(async (tx) => {
      const submission = await this.requirePending(tx, id);
      await tx.cardSubmission.update({
        where: { id },
        data: { status: SubmissionStatus.REJECTED, decidedAt: new Date() },
      });
      return submission;
    });
  }

  /** Approves everything waiting. Returns how many cards were added. */
  async approveAll(): Promise<number> {
    return this.prisma.$transaction(async (tx) => {
      const pending = await tx.cardSubmission.findMany({
        where: { status: SubmissionStatus.PENDING },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      });
      const existing = new Set((await tx.card.findMany({ select: { text: true } })).map((c) => normalise(c.text)));
      const now = new Date();
      let added = 0;
      for (const submission of pending) {
        if (!existing.has(normalise(submission.text))) {
          await tx.card.create({
            data: { category: submission.category, text: submission.text, spicy: submission.spicy },
          });
          existing.add(normalise(submission.text));
          added += 1;
        }
        await tx.cardSubmission.update({
          where: { id: submission.id },
          data: { status: SubmissionStatus.APPROVED, decidedAt: now },
        });
      }
      return added;
    });
  }

  private async requirePending(tx: Prisma.TransactionClient, id: string) {
    const submission = await tx.cardSubmission.findUnique({ where: { id } });
    if (!submission) throw new NotFoundException('That suggestion was not found.');
    if (submission.status !== SubmissionStatus.PENDING) {
      throw new BadRequestException('That suggestion was already handled.');
    }
    return submission;
  }
}
