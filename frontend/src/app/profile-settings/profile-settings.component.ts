import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { PortfolioService, UserProfile } from '../services/portfolio.service';
import { ApiService } from '../services/api.service';
import { UserSkill } from '../models/skill.model';
import { SkillTagComponent } from '../components/skill-tag/skill-tag.component';
import { SkillSelectorComponent } from '../components/skill-selector/skill-selector.component';

@Component({
  selector: 'app-profile-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, SkillTagComponent, SkillSelectorComponent],
  templateUrl: './profile-settings.component.html',
  styleUrl: './profile-settings.component.css'
})
export class ProfileSettingsComponent implements OnInit {
  profileForm: FormGroup;
  userProfile: UserProfile | null = null;
  loading: boolean = true;
  saving: boolean = false;
  message: string = '';
  messageType: 'success' | 'error' = 'success';
  
  selectedFile: File | null = null;
  uploadingImage: boolean = false;
  previewUrl: string | null = null;
  
  // Skills related properties
  userSkills: UserSkill[] = [];
  showSkillSelector: boolean = false;
  loadingSkills: boolean = false;

  constructor(
    private fb: FormBuilder,
    private portfolioService: PortfolioService,
    private apiService: ApiService,
    private router: Router
  ) {
    this.profileForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      jobTitle: [''],
      bio: ['', [Validators.maxLength(500)]]
    });
  }

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile() {
    this.loading = true;
    this.portfolioService.getUserProfile().subscribe({
      next: (profile) => {
        this.userProfile = profile;
        this.userSkills = profile.skills || [];
        this.profileForm.patchValue({
          name: profile.name,
          email: profile.email,
          jobTitle: profile.jobTitle || '',
          bio: profile.bio || ''
        });
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load profile:', error);
        this.showMessage('Failed to load profile data', 'error');
        this.loading = false;
      }
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

  uploadProfileImage() {
    if (!this.selectedFile) return;

    this.uploadingImage = true;
    this.portfolioService.uploadProfileImage(this.selectedFile).subscribe({
      next: (response) => {
        this.showMessage('Profile image updated successfully', 'success');
        this.userProfile!.profileImageUrl = response.imageUrl;
        this.selectedFile = null;
        this.previewUrl = null;
        this.uploadingImage = false;
        
        // Reset file input
        const fileInput = document.getElementById('profileImage') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      },
      error: (error) => {
        console.error('Failed to upload image:', error);
        this.showMessage('Failed to upload image', 'error');
        this.uploadingImage = false;
      }
    });
  }

  deleteImage() {
    this.selectedFile = null;
    this.previewUrl = null;
    
    // Reset file input
    const fileInput = document.getElementById('profileImage') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  onSubmit() {
    if (this.profileForm.valid) {
      this.saving = true;
      this.message = '';

      const profileData = this.profileForm.value;
      
      this.portfolioService.updateProfile(profileData).subscribe({
        next: (updatedProfile) => {
          this.userProfile = updatedProfile;
          this.showMessage('Profile updated successfully', 'success');
          this.saving = false;
        },
        error: (error) => {
          console.error('Failed to update profile:', error);
          this.showMessage('Failed to update profile', 'error');
          this.saving = false;
        }
      });
    } else {
      this.showMessage('Please fill in all required fields correctly', 'error');
    }
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

  getProfileImageUrl(): string {
    if (this.previewUrl) return this.previewUrl;
    return this.userProfile?.profileImageUrl || '/assets/default-avatar.png';
  }

  // Skills management methods
  toggleSkillSelector() {
    this.showSkillSelector = !this.showSkillSelector;
  }

  onSkillAdded(userSkill: UserSkill) {
    this.userSkills.push(userSkill);
    this.showSkillSelector = false;
    this.showMessage('Skill added successfully!', 'success');
  }

  onSkillSelectorCancelled() {
    this.showSkillSelector = false;
  }

  onRemoveSkill(userSkill: UserSkill) {
    if (!this.userProfile) return;

    this.apiService.removeSkillFromUser(this.userProfile.id, userSkill.skill.id).subscribe({
      next: () => {
        this.userSkills = this.userSkills.filter(us => us.id !== userSkill.id);
        this.showMessage('Skill removed successfully!', 'success');
      },
      error: (error) => {
        console.error('Failed to remove skill:', error);
        this.showMessage('Failed to remove skill', 'error');
      }
    });
  }

  get nameErrors() {
    const control = this.profileForm.get('name');
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'Name is required';
      if (control.errors['minlength']) return 'Name must be at least 2 characters';
    }
    return null;
  }

  get emailErrors() {
    const control = this.profileForm.get('email');
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'Email is required';
      if (control.errors['email']) return 'Please enter a valid email';
    }
    return null;
  }

  get bioErrors() {
    const control = this.profileForm.get('bio');
    if (control?.errors && control.touched) {
      if (control.errors['maxlength']) return 'Bio must be less than 500 characters';
    }
    return null;
  }
}