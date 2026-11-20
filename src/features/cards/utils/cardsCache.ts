import { readJson, writeJson } from '../../../lib/storage'
import type { Prompt } from '../../game/types/game.types'
import { parseCachedPrompts } from './cardParsing'

const CACHE_KEY = 'jenga-and-degenerates:cards-cache:v1'

/** The last cards this phone got from the server, so the game still works on bad party Wi-Fi. */
export function readCachedPrompts(): Prompt[] | null {
  return parseCachedPrompts(readJson(CACHE_KEY))
}

export function writeCachedPrompts(prompts: readonly Prompt[]): void {
  writeJson(CACHE_KEY, { version: 1, prompts })
}
