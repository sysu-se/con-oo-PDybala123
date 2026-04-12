class Sudoku {
  constructor(input) {
    this.grid = input
      ? JSON.parse(JSON.stringify(input))
      : Array(9).fill().map(() => Array(9).fill(0));
  }

  getGrid() {
    return JSON.parse(JSON.stringify(this.grid));
  }

  guess({ row, col, value }) {
    this.grid[row][col] = value;
  }

  clone() {
    return new Sudoku(this.grid);
  }

  toJSON() {
    return { grid: this.grid };
  }

  toString() {
    return this.grid.map(r => r.join(' ')).join('\n');
  }
}

class Game {
  constructor(sudoku) {
    this.current = sudoku.clone();
    this.history = [this.current.clone()];
    this.currentIndex = 0;
  }

  guess(move) {
    const next = this.current.clone();
    next.guess(move);

    this.history = this.history.slice(0, this.currentIndex + 1);
    this.history.push(next);
    this.currentIndex++;
    this.current = next;
  }

  undo() {
    if (this.canUndo()) {
      this.currentIndex--;
      this.current = this.history[this.currentIndex].clone();
    }
  }

  redo() {
    if (this.canRedo()) {
      this.currentIndex++;
      this.current = this.history[this.currentIndex].clone();
    }
  }

  canUndo() {
    return this.currentIndex > 0;
  }

  canRedo() {
    return this.currentIndex < this.history.length - 1;
  }

  getSudoku() {
    return this.current.clone();
  }

  toJSON() {
    return {
      history: this.history.map(s => s.toJSON()),
      currentIndex: this.currentIndex
    };
  }
}

export function createSudoku(input) {
  return new Sudoku(input);
}

export function createSudokuFromJSON(json) {
  return new Sudoku(json.grid);
}

export function createGame(sudoku) {
  return new Game(sudoku);
}

export function createGameFromJSON(json) {
  const history = json.history.map(createSudokuFromJSON);
  const game = new Game(history[0]);
  game.history = history;
  game.currentIndex = json.currentIndex;
  game.current = history[game.currentIndex].clone();
  return game;
}
