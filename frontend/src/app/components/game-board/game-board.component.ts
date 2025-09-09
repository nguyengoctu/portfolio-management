import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-game-board',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game-board.component.html',
  styleUrl: './game-board.component.css'
})
export class GameBoardComponent implements OnInit {
  @Input() board: (string | null)[][] = [];
  @Input() canMakeMove: boolean = false;
  @Input() winningLine: number[][] | null = null;
  @Input() lastMove: { row: number; col: number } | null = null;
  @Output() cellClick = new EventEmitter<{row: number, col: number}>();

  boardSize = 20;

  ngOnInit() {
    if (this.board.length === 0) {
      this.initializeBoard();
    }
  }

  private initializeBoard() {
    this.board = Array(this.boardSize).fill(null).map(() => Array(this.boardSize).fill(null));
  }

  onCellClick(row: number, col: number) {
    if (this.canMakeMove && this.board[row][col] === null) {
      this.cellClick.emit({ row, col });
    }
  }

  isCellInWinningLine(row: number, col: number): boolean {
    if (!this.winningLine) return false;
    
    return this.winningLine.some(([winRow, winCol]) => winRow === row && winCol === col);
  }

  isLastMove(row: number, col: number): boolean {
    return this.lastMove?.row === row && this.lastMove?.col === col;
  }

  getCellClass(row: number, col: number): string {
    let classes = ['cell'];
    
    const cellValue = this.board[row][col];
    if (cellValue) {
      classes.push(`cell-${cellValue.toLowerCase()}`);
    }
    
    if (this.isCellInWinningLine(row, col)) {
      classes.push('winning-cell');
    }
    
    if (this.isLastMove(row, col)) {
      classes.push('last-move');
    }
    
    if (this.canMakeMove && !cellValue) {
      classes.push('clickable');
    }
    
    return classes.join(' ');
  }
}