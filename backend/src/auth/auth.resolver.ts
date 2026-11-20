import { UseGuards } from '@nestjs/common';
import { Query, Resolver } from '@nestjs/graphql';
import { AdminGuard } from './admin.guard';

@Resolver()
export class AuthResolver {
  /** Lets the admin page check a password before showing the manager. */
  @Query(() => Boolean, { description: 'True when the supplied admin password is correct.' })
  @UseGuards(AdminGuard)
  adminCheck(): boolean {
    return true;
  }
}
