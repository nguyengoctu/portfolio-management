import { Component, OnInit, OnChanges, SimpleChanges, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Skill, UserSkill, ProficiencyLevel, AddUserSkillRequest } from '../../models/skill.model';

@Component({
  selector: 'app-skill-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="skill-selector">
      <div class="skill-selector-header">
        <h3>Add New Skill</h3>
      </div>
      
      <div class="form-group">
        <label for="categoryFilter">Filter by Category:</label>
        <select id="categoryFilter" [(ngModel)]="selectedCategory" (change)="onCategoryChange()" class="form-select">
          <option value="">All Categories</option>
          <option *ngFor="let category of categories" [value]="category">{{ category }}</option>
        </select>
      </div>

      <div class="form-group">
        <label for="skillSelect">Select Skill:</label>
        <select id="skillSelect" [(ngModel)]="selectedSkillId" class="form-select">
          <option value="">Choose a skill...</option>
          <option *ngFor="let skill of filteredSkills" [value]="skill.id">{{ skill.name }}</option>
        </select>
      </div>

      <div class="form-group">
        <label for="proficiencyLevel">Proficiency Level:</label>
        <select id="proficiencyLevel" [(ngModel)]="selectedProficiency" class="form-select">
          <option value="BEGINNER">Beginner</option>
          <option value="INTERMEDIATE">Intermediate</option>
          <option value="ADVANCED">Advanced</option>
          <option value="EXPERT">Expert</option>
        </select>
      </div>

      <div class="form-actions">
        <button 
          type="button" 
          class="btn btn-primary" 
          (click)="addSkill()"
          [disabled]="!selectedSkillId || adding">
          {{ adding ? 'Adding...' : 'Add Skill' }}
        </button>
        <button 
          type="button" 
          class="btn btn-secondary" 
          (click)="cancel()">
          Cancel
        </button>
      </div>

      <div *ngIf="message" class="alert" [ngClass]="messageType === 'success' ? 'alert-success' : 'alert-error'">
        {{ message }}
      </div>
    </div>
  `,
  styles: [`
    .skill-selector {
      background: white;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      margin-bottom: 20px;
    }

    .skill-selector-header h3 {
      margin: 0 0 15px 0;
      color: #333;
      font-size: 1.25rem;
    }

    .form-group {
      margin-bottom: 15px;
    }

    .form-group label {
      display: block;
      margin-bottom: 5px;
      font-weight: 500;
      color: #555;
    }

    .form-select {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
      background: white;
    }

    .form-select:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
    }

    .form-actions {
      display: flex;
      gap: 10px;
      margin-top: 20px;
    }

    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s ease;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-primary {
      background: #007bff;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #0056b3;
    }

    .btn-secondary {
      background: #6c757d;
      color: white;
    }

    .btn-secondary:hover {
      background: #545b62;
    }

    .alert {
      padding: 12px;
      border-radius: 4px;
      margin-top: 15px;
    }

    .alert-success {
      background: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }

    .alert-error {
      background: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }
  `]
})
export class SkillSelectorComponent implements OnInit, OnChanges {
  @Input() userId!: number;
  @Input() userSkills: UserSkill[] = [];
  @Output() skillAdded = new EventEmitter<UserSkill>();
  @Output() cancelled = new EventEmitter<void>();

  allSkills: Skill[] = [];
  categories: string[] = [];
  filteredSkills: Skill[] = [];
  
  selectedCategory: string = '';
  selectedSkillId: number | string = '';
  selectedProficiency: ProficiencyLevel = ProficiencyLevel.INTERMEDIATE;
  
  adding: boolean = false;
  message: string = '';
  messageType: 'success' | 'error' = 'success';

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadSkills();
    this.loadCategories();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['userSkills']) {
      this.filterSkills();
    }
  }

  loadSkills() {
    this.apiService.getAllSkills().subscribe({
      next: (skills) => {
        this.allSkills = skills;
        this.filterSkills();
      },
      error: (error) => {
        console.error('Failed to load skills:', error);
        this.showMessage('Failed to load skills', 'error');
      }
    });
  }

  loadCategories() {
    this.apiService.getSkillCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (error) => {
        console.error('Failed to load categories:', error);
      }
    });
  }

  onCategoryChange() {
    this.selectedSkillId = '';
    this.filterSkills();
  }

  filterSkills() {
    if (!this.allSkills || this.allSkills.length === 0) {
      this.filteredSkills = [];
      return;
    }

    let skills = [...this.allSkills];
    
    // Filter by category
    if (this.selectedCategory) {
      skills = skills.filter(skill => skill.category === this.selectedCategory);
    }
    
    // Exclude skills user already has
    if (this.userSkills && this.userSkills.length > 0) {
      const userSkillIds = this.userSkills.map(us => us.skill.id);
      skills = skills.filter(skill => !userSkillIds.includes(skill.id));
    }
    
    this.filteredSkills = skills;
    console.log('Filtered skills:', skills.length, 'User skills:', this.userSkills?.length || 0);
  }

  addSkill() {
    if (!this.selectedSkillId) return;

    this.adding = true;
    this.message = '';

    const request: AddUserSkillRequest = {
      skillId: Number(this.selectedSkillId),
      proficiencyLevel: this.selectedProficiency
    };

    console.log('=== Frontend Request Debug ===');
    console.log('Selected Skill ID (raw):', this.selectedSkillId);
    console.log('Selected Skill ID (type):', typeof this.selectedSkillId);
    console.log('Selected Skill ID (converted):', Number(this.selectedSkillId));
    console.log('Selected Proficiency:', this.selectedProficiency);
    console.log('User ID:', this.userId);
    console.log('Request object:', request);
    console.log('Request JSON:', JSON.stringify(request));
    console.log('=== End Debug ===');

    this.apiService.addSkillToUser(this.userId, request).subscribe({
      next: (userSkill) => {
        console.log('Skill added successfully:', userSkill);
        this.skillAdded.emit(userSkill);
        this.showMessage('Skill added successfully!', 'success');
        this.resetForm();
        this.adding = false;
        this.filterSkills(); // Refresh available skills
      },
      error: (error) => {
        console.error('=== Frontend Error Debug ===');
        console.error('Full error object:', error);
        console.error('Error status:', error.status);
        console.error('Error message:', error.message);
        console.error('Error body:', error.error);
        console.error('Request that failed:', request);
        console.error('User ID that failed:', this.userId);
        console.error('=== End Error Debug ===');
        this.showMessage('Failed to add skill: ' + (error.error?.error || error.message), 'error');
        this.adding = false;
      }
    });
  }

  cancel() {
    this.cancelled.emit();
  }

  resetForm() {
    this.selectedSkillId = '';
    this.selectedProficiency = ProficiencyLevel.INTERMEDIATE;
    this.selectedCategory = '';
  }

  showMessage(message: string, type: 'success' | 'error') {
    this.message = message;
    this.messageType = type;
    
    setTimeout(() => {
      this.message = '';
    }, 3000);
  }
}