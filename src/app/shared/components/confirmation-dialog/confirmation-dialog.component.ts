import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

export interface DialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
}

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="confirm-dialog-wrapper p-3">
      <div class="d-flex align-items-start gap-3 mb-3">
        <div class="confirm-icon-box">
          <mat-icon>warning_amber</mat-icon>
        </div>
        <div>
          <h3 class="h6 fw-bold text-dark mb-1">{{ data.title }}</h3>
          <p class="text-muted small mb-0">{{ data.message }}</p>
        </div>
      </div>

      <div class="d-flex justify-content-end gap-2 pt-2 border-top">
        <button type="button" class="btn btn-outline-secondary btn-sm px-3" mat-dialog-close>
          {{ data.cancelText || 'Cancel' }}
        </button>
        <button type="button" class="btn btn-danger btn-sm px-3" [mat-dialog-close]="true" cdkFocusInitial>
          {{ data.confirmText || 'Confirm' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .confirm-dialog-wrapper {
      background: #ffffff;
      border-radius: 10px;

      .confirm-icon-box {
        width: 38px;
        height: 38px;
        border-radius: 50%;
        background: #fef2f2;
        color: #dc2626;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        mat-icon {
          font-size: 22px;
          width: 22px;
          height: 22px;
        }
      }
    }
  `]
})
export class ConfirmationDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {}
}
