import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AdminGuard } from '../auth/admin.guard';
import { Category } from '../generated/prisma/enums';
import { Card } from './card.model';
import { CreateCardInput, UpdateCardInput } from './card.inputs';
import { CardsService } from './cards.service';

@Resolver(() => Card)
export class CardsResolver {
  constructor(private readonly cardsService: CardsService) {}

  /** Public: the game loads its cards from here. */
  @Query(() => [Card], {
    name: 'cards',
    description: 'All cards, optionally filtered by category and/or spicy.',
  })
  listCards(
    @Args('category', { type: () => Category, nullable: true }) category?: Category,
    @Args('spicy', { nullable: true }) spicy?: boolean,
  ) {
    return this.cardsService.findAll({ category, spicy });
  }

  @Mutation(() => Card)
  @UseGuards(AdminGuard)
  createCard(@Args('input') input: CreateCardInput) {
    return this.cardsService.create(input);
  }

  @Mutation(() => Card)
  @UseGuards(AdminGuard)
  updateCard(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateCardInput,
  ) {
    return this.cardsService.update(id, input);
  }

  @Mutation(() => Card, { description: 'Deletes a card and returns it.' })
  @UseGuards(AdminGuard)
  deleteCard(@Args('id', { type: () => ID }) id: string) {
    return this.cardsService.remove(id);
  }
}
