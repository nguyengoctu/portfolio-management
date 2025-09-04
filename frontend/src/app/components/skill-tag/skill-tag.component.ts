import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserSkill, ProficiencyLevel } from '../../models/skill.model';

@Component({
  selector: 'app-skill-tag',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span 
      class="skill-tag" 
      [style.background-color]="userSkill.skill.color"
      [class.removable]="removable"
      [title]="getTooltipText()">
      <span class="skill-name">{{ userSkill.skill.name }}</span>
      <span *ngIf="showLevel" class="skill-level" [class]="getLevelClass()">{{ getProficiencyDisplay() }}</span>
      <button 
        *ngIf="removable" 
        class="remove-btn" 
        (click)="onRemove()"
        type="button"
        aria-label="Remove skill">
        ×
      </button>
    </span>
  `,
  styles: [`
    .skill-tag {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 6px 12px;
      border-radius: 20px;
      color: white;
      font-size: 0.875rem;
      font-weight: 500;
      margin: 2px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      transition: all 0.2s ease;
      position: relative;
    }

    .skill-tag:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
    }

    .skill-name {
      font-weight: 600;
    }

    .skill-level {
      font-size: 0.75rem;
      background: rgba(255, 255, 255, 0.2);
      padding: 2px 6px;
      border-radius: 10px;
      font-weight: 400;
    }

    .level-beginner { 
      background: rgba(255, 193, 7, 0.3); 
    }
    
    .level-intermediate { 
      background: rgba(40, 167, 69, 0.3); 
    }
    
    .level-advanced { 
      background: rgba(23, 162, 184, 0.3); 
    }
    
    .level-expert { 
      background: rgba(220, 53, 69, 0.3); 
    }

    .removable {
      cursor: pointer;
      padding-right: 8px;
    }

    .remove-btn {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      color: white;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 14px;
      line-height: 1;
      transition: background 0.2s ease;
      margin-left: 4px;
    }

    .remove-btn:hover {
      background: rgba(255, 255, 255, 0.3);
    }
  `]
})
export class SkillTagComponent {
  @Input() userSkill!: UserSkill;
  @Input() removable: boolean = false;
  @Input() showLevel: boolean = true;
  @Output() remove = new EventEmitter<UserSkill>();

  onRemove() {
    this.remove.emit(this.userSkill);
  }

  getProficiencyDisplay(): string {
    switch (this.userSkill.proficiencyLevel) {
      case ProficiencyLevel.BEGINNER: return 'Beginner';
      case ProficiencyLevel.INTERMEDIATE: return 'Intermediate';
      case ProficiencyLevel.ADVANCED: return 'Advanced';
      case ProficiencyLevel.EXPERT: return 'Expert';
      default: return 'Intermediate';
    }
  }

  getLevelClass(): string {
    return `level-${this.userSkill.proficiencyLevel.toLowerCase()}`;
  }

  getTooltipText(): string {
    return `${this.userSkill.skill.name} - ${this.getProficiencyDisplay()} level in ${this.userSkill.skill.category}`;
  }
}