class Sudoku {
  constructor(input) {
    this.grid = input ? JSON.parse(JSON.stringify(input)) : Array(9).fill().map(() => Array(9).fill(0));
  }

  getGrid() {
    return JSON.parse(JSON.stringify(this.grid));
  }

  guess(move) {
    const { row, col, value } = move;
    this.grid[row][col] = value;
  }

  clone() {
    return new Sudoku(this.grid);
  }

  toJSON() {
    return { grid: this.grid };
  }

  toString() {
    return this.grid.map(row => row.join(' ')).join('\n');
  }
}

class Game {
  constructor({ sudoku }) {
    this.sudoku = sudoku.clone();
    this.history = [sudoku.clone()];
    this.currentStep = 0;
  }

  getSudoku() {
    return this.sudoku.clone();
  }

  guess(move) {
    const newSudoku = this.sudoku.clone();
    newSudoku.guess(move);
    this.history = this.history.slice(0, this.currentStep + 1);
    this.history.push(newSudoku);
    this.currentStep = this.history.length - 1;
    this.sudoku = newSudoku;
  }

  undo() {
    if (this.canUndo()) {
      this.currentStep--;
      this.sudoku = this.history[this.currentStep].clone();
    }
  }

  redo() {
    if (this.canRedo()) {
      this.currentStep++;
      this.sudoku = this.history[this.currentStep].clone();
    }
  }

  canUndo() {
    return this.currentStep > 0;
  }

  canRedo() {
    return this.currentStep < this.history.length - 1;
  }

  toJSON() {
    return {
      sudoku: this.sudoku.toJSON(),
      history: this.history.map(h => h.toJSON()),
      currentStep: this.currentStep
    };
  }
}

export function createSudoku(input) {
  return new Sudoku(input);
}

export function createSudokuFromJSON(json) {
  return Sudoku.fromJSON(json);
}

export function createGame({ sudoku }) {
  return new Game({ sudoku });
}

export function createGameFromJSON(json) {
  return Game.fromJSON(json);
}

Sudoku.fromJSON = function (json) {
  return new Sudoku(json.grid);
};

Game.fromJSON = function (json) {
  const sudoku = Sudoku.fromJSON(json.sudoku);
  const game = new Game({ sudoku });
  game.history = json.history.map(h => Sudoku.fromJSON(h));
  game.currentStep = json.currentStep;
  game.sudoku = game.history[game.currentStep].clone();
  return game;
};
