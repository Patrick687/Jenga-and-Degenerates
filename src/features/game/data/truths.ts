import type { Prompt } from '../types/game.types'
import { createPrompts } from '../utils/promptHelpers'

// IDs are generated from position: append new prompts to the END to keep IDs stable.
export const truthPrompts: Prompt[] = createPrompts('truth', false, [
  "What's the most embarrassing thing you've done trying to impress someone?",
  "What's the most questionable crush you've ever had? Names optional.",
  "What's a red flag you knowingly ignore if someone is hot enough?",
  "What's the most delusional thing you've ever convinced yourself of?",
  "What's your worst first-date story?",
  "Have you ever stalked someone's social media way further than you should have?",
  "What's something you pretend to hate but secretly love?",
  "What's the thirstiest thing you've ever done?",
  "What's an immediate ick for you?",
  "What's the worst text you've ever sent?",
  "What's your most toxic trait when you're attracted to someone?",
  "What's a lie you tell frequently?",
  "What's the most unserious reason you've ever stopped talking to someone?",
  "What's your most controversial opinion about dating?",
  "Have you ever had a crush on someone you absolutely shouldn't have?",
  "What's something you would never want your parents knowing about your dating life?",
  "What is your biggest guilty pleasure?",
  "What's something about you that people in this room would be surprised to learn?",
  "What's the pettiest thing you've ever done and would absolutely do again?",
  "What's the most cursed outfit you've worn to impress someone?",
  "What's the most unhinged thing you've done to avoid running into someone?",
  "What's the most dramatic exit you've ever made from a party, a date, or a group chat?",
  "What's your signature move when you want someone to notice you?",
  "What's a hill you'll die on that nobody asked you to defend?",
  "What's the most embarrassing way you've ever misread flirting?",
  "What's a green flag you've ignored because you were too busy chasing red ones?",
])
