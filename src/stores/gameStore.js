import { writable } from 'svelte';
import { createGame, createSudoku } from '../domain';

export function createGameStore(initialGrid = null) {
  const sudoku = createSudoku(initialGrid);
  const game = createGame(sudoku);

  const { subscribe, set } = writable({
    grid: game.getSudoku().getGrid(),
    canUndo: game.canUndo(),
    canRedo: game.canRedo()
  });

  function sync() {
    set({
      grid: game.getSudoku().getGrid(),
      canUndo: game.canUndo(),
      canRedo: game.canRedo()
    });
  }

  return {
    subscribe,
    guess(move) {
      game.guess(move);
      sync();
    },
    undo() {
      game.undo();
      sync();
    },
    redo() {
      game.redo();
      sync();
    }
  };
}

export const gameStore = createGameStore();
