import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { PortfolioService, Project, UserProfile } from '../services/portfolio.service';

@Component({
  selector: 'app-projects-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './projects-settings.component.html',
  styleUrl: './projects-settings.component.css'
})
export class ProjectsSettingsComponent implements OnInit {
  projectForm: FormGroup;
  projects: Project[] = [];
  userProfile: UserProfile | null = null;
  loading: boolean = true;
  saving: boolean = false;
  message: string = '';
  messageType: 'success' | 'error' = 'success';
  
  editingProject: Project | null = null;
  selectedFile: File | null = null;
  previewUrl: string | null = null;

  constructor(
    private fb: FormBuilder,
    private portfolioService: PortfolioService,
    private router: Router
  ) {
    this.projectForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      demoUrl: ['', [Validators.pattern(/^https?:\/\/.+/)]],
      repositoryUrl: ['', [Validators.pattern(/^https?:\/\/.+/)]]
    });
  }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    
    Promise.all([
      this.portfolioService.getUserProfile().toPromise(),
      this.portfolioService.getUserProjects().toPromise()
    ])
    .then(([profile, projects]) => {
      this.userProfile = profile || null;
      this.projects = projects || [];
      this.loading = false;
    })
    .catch(error => {
      console.error('Failed to load data:', error);
      this.showMessage('Failed to load data', 'error');
      this.loading = false;
    });
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.showMessage('Please select an image file', 'error');
        return;
      }

      // Validate file size (2MB max)
      if (file.size > 2 * 1024 * 1024) {
        this.showMessage('Image size must be less than 2MB', 'error');
        return;
      }

      this.selectedFile = file;
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewUrl = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  deleteImage() {
    this.selectedFile = null;
    this.previewUrl = null;
    
    // Reset file input
    const fileInput = document.getElementById('projectImage') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  addNewProject() {
    this.editingProject = null;
    this.projectForm.reset();
    this.selectedFile = null;
    this.previewUrl = null;
    
    // Reset file input
    const fileInput = document.getElementById('projectImage') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  editProject(project: Project) {
    this.editingProject = project;
    this.projectForm.patchValue({
      name: project.name,
      description: project.description || '',
      demoUrl: project.demoUrl || '',
      repositoryUrl: project.repositoryUrl || ''
    });
    this.selectedFile = null;
    this.previewUrl = null;
    
    // Reset file input
    const fileInput = document.getElementById('projectImage') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  onSubmit() {
    if (this.projectForm.valid) {
      this.saving = true;
      this.message = '';

      const projectData = this.projectForm.value;
      
      if (this.editingProject) {
        // Update existing project
        this.portfolioService.updateProject(this.editingProject.id, projectData, this.selectedFile || undefined)
          .subscribe({
            next: (updatedProject) => {
              const index = this.projects.findIndex(p => p.id === updatedProject.id);
              if (index !== -1) {
                this.projects[index] = updatedProject;
              }
              this.showMessage('Project updated successfully', 'success');
              this.resetForm();
              this.saving = false;
            },
            error: (error) => {
              console.error('Failed to update project:', error);
              this.showMessage('Failed to update project', 'error');
              this.saving = false;
            }
          });
      } else {
        // Create new project
        this.portfolioService.createProject(projectData, this.selectedFile || undefined)
          .subscribe({
            next: (newProject) => {
              this.projects.unshift(newProject);
              this.showMessage('Project created successfully', 'success');
              this.resetForm();
              this.saving = false;
            },
            error: (error) => {
              console.error('Failed to create project:', error);
              this.showMessage('Failed to create project', 'error');
              this.saving = false;
            }
          });
      }
    } else {
      this.showMessage('Please fill in all required fields correctly', 'error');
    }
  }

  deleteProject(project: Project) {
    if (confirm(`Are you sure you want to delete "${project.name}"?`)) {
      this.portfolioService.deleteProject(project.id).subscribe({
        next: () => {
          this.projects = this.projects.filter(p => p.id !== project.id);
          this.showMessage('Project deleted successfully', 'success');
          
          // If we're editing the deleted project, reset the form
          if (this.editingProject?.id === project.id) {
            this.resetForm();
          }
        },
        error: (error) => {
          console.error('Failed to delete project:', error);
          this.showMessage('Failed to delete project', 'error');
        }
      });
    }
  }

  resetForm() {
    this.editingProject = null;
    this.projectForm.reset();
    this.selectedFile = null;
    this.previewUrl = null;
    
    // Reset file input
    const fileInput = document.getElementById('projectImage') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  showMessage(message: string, type: 'success' | 'error') {
    this.message = message;
    this.messageType = type;
    
    // Auto hide message after 5 seconds
    setTimeout(() => {
      this.message = '';
    }, 5000);
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }

  getProjectImageUrl(project?: Project): string {
    if (this.previewUrl && this.editingProject?.id === project?.id) {
      return this.previewUrl;
    }
    return project?.imageUrl || '/assets/default-project.png';
  }

  getFormImageUrl(): string {
    if (this.previewUrl) return this.previewUrl;
    if (this.editingProject?.imageUrl) return this.editingProject.imageUrl;
    return '/assets/default-project.png';
  }

  getUserImageUrl(): string {
    return this.userProfile?.profileImageUrl || '/assets/default-avatar.png';
  }

  get nameErrors() {
    const control = this.projectForm.get('name');
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'Project name is required';
      if (control.errors['minlength']) return 'Project name must be at least 2 characters';
    }
    return null;
  }

  get demoUrlErrors() {
    const control = this.projectForm.get('demoUrl');
    if (control?.errors && control.touched) {
      if (control.errors['pattern']) return 'Please enter a valid URL (starting with http:// or https://)';
    }
    return null;
  }

  get repositoryUrlErrors() {
    const control = this.projectForm.get('repositoryUrl');
    if (control?.errors && control.touched) {
      if (control.errors['pattern']) return 'Please enter a valid URL (starting with http:// or https://)';
    }
    return null;
  }

  trackByProjectId(index: number, project: Project): number {
    return project.id;
  }
}