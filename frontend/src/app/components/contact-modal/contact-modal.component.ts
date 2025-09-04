import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-contact-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './contact-modal.component.html',
  styleUrl: './contact-modal.component.css'
})
export class ContactModalComponent {
  @Input() isOpen = false;
  @Input() recipientName = '';
  @Input() recipientId!: number;
  @Output() closeModal = new EventEmitter<void>();
  
  contactForm: FormGroup;
  sending = false;
  message = '';
  messageType: 'success' | 'error' = 'success';

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService
  ) {
    this.contactForm = this.fb.group({
      senderEmail: ['', [Validators.required, Validators.email]],
      senderName: ['', [Validators.required, Validators.minLength(2)]],
      subject: ['', [Validators.required, Validators.minLength(5)]],
      message: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  onSubmit() {
    if (this.contactForm.valid && !this.sending) {
      this.sending = true;
      this.message = '';

      const contactData = {
        recipientId: this.recipientId,
        senderEmail: this.contactForm.value.senderEmail,
        senderName: this.contactForm.value.senderName,
        subject: this.contactForm.value.subject,
        message: this.contactForm.value.message
      };

      this.apiService.sendContactMessage(contactData).subscribe({
        next: () => {
          this.showMessage('Message sent successfully!', 'success');
          this.contactForm.reset();
          setTimeout(() => {
            this.onClose();
          }, 2000);
        },
        error: (error) => {
          console.error('Failed to send message:', error);
          this.showMessage('Failed to send message. Please try again.', 'error');
          this.sending = false;
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  onClose() {
    this.closeModal.emit();
    this.contactForm.reset();
    this.message = '';
    this.sending = false;
  }

  onBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  private markFormGroupTouched() {
    Object.keys(this.contactForm.controls).forEach(key => {
      const control = this.contactForm.get(key);
      control?.markAsTouched();
    });
  }

  private showMessage(message: string, type: 'success' | 'error') {
    this.message = message;
    this.messageType = type;
    this.sending = false;
  }

  get senderEmailErrors() {
    const control = this.contactForm.get('senderEmail');
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'Email is required';
      if (control.errors['email']) return 'Please enter a valid email';
    }
    return null;
  }

  get senderNameErrors() {
    const control = this.contactForm.get('senderName');
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'Name is required';
      if (control.errors['minlength']) return 'Name must be at least 2 characters';
    }
    return null;
  }

  get subjectErrors() {
    const control = this.contactForm.get('subject');
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'Subject is required';
      if (control.errors['minlength']) return 'Subject must be at least 5 characters';
    }
    return null;
  }

  get messageErrors() {
    const control = this.contactForm.get('message');
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'Message is required';
      if (control.errors['minlength']) return 'Message must be at least 10 characters';
    }
    return null;
  }
}