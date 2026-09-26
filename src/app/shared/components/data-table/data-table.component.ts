import { 
  Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, 
  ViewChild, ChangeDetectorRef, inject, AfterViewInit 
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';

export interface TableColumn {
  def: string;
  header: string;
  cell: (element: any) => string;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    MatTableModule, 
    MatPaginatorModule, 
    MatSortModule, 
    MatButtonModule, 
    MatIconModule,
    MatTooltipModule,
    MatDialogModule
  ],
  template: `
    <div class="table-container-card">
      <!-- Table Filter Toolbar -->
      <div class="table-toolbar">
        <div class="search-box">
          <mat-icon class="search-icon">search</mat-icon>
          <input 
            type="text" 
            [(ngModel)]="filterValue"
            (ngModelChange)="applyFilter($event)"
            [placeholder]="searchPlaceholder" 
            class="search-input" />
          <button 
            *ngIf="filterValue" 
            class="clear-search-btn" 
            (click)="clearFilter()" 
            title="Clear filter">
            <mat-icon>close</mat-icon>
          </button>
        </div>

        <div class="toolbar-meta">
          <span class="count-badge" *ngIf="data && data.length > 0">
            <span class="badge-number">{{ dataSource.filteredData.length }}</span>
            <span class="badge-label">of {{ data.length }} records</span>
          </span>
        </div>
      </div>

      <!-- Main Responsive Table Wrapper -->
      <div class="table-responsive">
        <table mat-table [dataSource]="dataSource" matSort class="w-100 modern-mat-table">
          
          <ng-container *ngFor="let col of columns" [matColumnDef]="col.def">
            <th mat-header-cell *matHeaderCellDef mat-sort-header class="table-header-cell"> 
              {{ col.header }} 
            </th>
            <td mat-cell *matCellDef="let element" class="table-data-cell"> 
              <span class="cell-content">{{ col.cell(element) }}</span>
            </td>
          </ng-container>

          <!-- Actions Column -->
          <ng-container matColumnDef="actions" *ngIf="showActions">
            <th mat-header-cell *matHeaderCellDef class="table-header-cell text-end pe-4" style="width: 140px;">
              Actions
            </th>
            <td mat-cell *matCellDef="let element" class="table-data-cell text-end pe-3">
              <div class="action-buttons-group">
                <button 
                  type="button"
                  class="action-btn action-view" 
                  *ngIf="showView" 
                  (click)="onView.emit(element)" 
                  matTooltip="View Details"
                  matTooltipPosition="above">
                  <mat-icon>visibility</mat-icon>
                </button>
                <button 
                  type="button"
                  class="action-btn action-edit" 
                  *ngIf="showEdit" 
                  (click)="onEdit.emit(element)" 
                  matTooltip="Edit Record"
                  matTooltipPosition="above">
                  <mat-icon>edit</mat-icon>
                </button>
                <button 
                  type="button"
                  class="action-btn action-delete" 
                  *ngIf="showDelete" 
                  (click)="handleDeleteClick(element)" 
                  matTooltip="Delete Record"
                  matTooltipPosition="above">
                  <mat-icon>delete_outline</mat-icon>
                </button>
              </div>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns" class="table-header-row"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="table-body-row"></tr>
        </table>

        <!-- Empty State Container -->
        <div *ngIf="dataSource.filteredData.length === 0" class="empty-state-container">
          <div class="empty-icon-circle">
            <mat-icon>{{ filterValue ? 'search_off' : 'inbox' }}</mat-icon>
          </div>
          <div class="empty-title">{{ filterValue ? 'No matching records' : emptyMessage }}</div>
          <div class="empty-subtext">
            {{ filterValue ? 'Try adjusting your search terms or clear the filter.' : 'New records added will appear here in the registry.' }}
          </div>
          <button *ngIf="filterValue" class="btn btn-outline-secondary btn-sm mt-3" (click)="clearFilter()">
            Clear Search
          </button>
        </div>
      </div>

      <!-- Modern Pagination Footer -->
      <div class="table-footer-paginator">
        <mat-paginator 
          [pageSizeOptions]="[5, 10, 20, 50]" 
          showFirstLastButtons
          class="custom-paginator">
        </mat-paginator>
      </div>
    </div>
  `,
  styles: [`
    .table-container-card {
      background: #ffffff;
      border-radius: 8px;
      overflow: hidden;
    }

    .table-toolbar {
      padding: 0.85rem 1.25rem;
      border-bottom: 1px solid #e2e8f0;
      background: #ffffff;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;

      .search-box {
        position: relative;
        display: flex;
        align-items: center;
        background: #f8fafc;
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        padding: 0.35rem 0.75rem;
        gap: 0.5rem;
        width: 100%;
        max-width: 320px;
        transition: all 0.2s ease;

        &:focus-within {
          background: #ffffff;
          border-color: #b71c1c;
          box-shadow: 0 0 0 3px rgba(183, 28, 28, 0.1);
        }

        .search-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
          color: #94a3b8;
        }

        .search-input {
          border: none;
          background: transparent;
          outline: none;
          font-size: 0.85rem;
          color: #0f172a;
          width: 100%;

          &::placeholder {
            color: #94a3b8;
          }
        }

        .clear-search-btn {
          border: none;
          background: transparent;
          color: #94a3b8;
          padding: 0;
          cursor: pointer;
          display: flex;
          align-items: center;

          &:hover {
            color: #0f172a;
          }

          mat-icon {
            font-size: 16px;
            width: 16px;
            height: 16px;
          }
        }
      }

      .toolbar-meta {
        display: flex;
        align-items: center;

        .count-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.8rem;
          color: #64748b;
          background: #f1f5f9;
          padding: 0.25rem 0.65rem;
          border-radius: 20px;
          border: 1px solid #e2e8f0;

          .badge-number {
            font-weight: 700;
            color: #0f172a;
          }
        }
      }
    }

    .modern-mat-table {
      background: transparent;
      border-collapse: separate;
      border-spacing: 0;

      .table-header-row {
        background-color: #f8fafc;
        height: 44px;

        .table-header-cell {
          color: #475569;
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          border-bottom: 1px solid #e2e8f0;
          padding: 0 1rem;
        }
      }

      .table-body-row {
        height: 52px;
        transition: background-color 0.15s ease;

        &:hover {
          background-color: #f8fafc;
        }

        .table-data-cell {
          font-size: 0.88rem;
          color: #1e293b;
          border-bottom: 1px solid #f1f5f9;
          padding: 0 1rem;

          .cell-content {
            display: inline-block;
            vertical-align: middle;
          }
        }
      }
    }

    .action-buttons-group {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;

      .action-btn {
        width: 32px;
        height: 32px;
        border-radius: 6px;
        border: 1px solid transparent;
        background: transparent;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.15s ease;
        padding: 0;

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }

        &.action-view {
          color: #0284c7;
          &:hover {
            background: #e0f2fe;
            border-color: #bae6fd;
          }
        }

        &.action-edit {
          color: #2563eb;
          &:hover {
            background: #eff6ff;
            border-color: #bfdbfe;
          }
        }

        &.action-delete {
          color: #dc2626;
          &:hover {
            background: #fef2f2;
            border-color: #fecaca;
          }
        }
      }
    }

    .empty-state-container {
      padding: 3.5rem 1.5rem;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;

      .empty-icon-circle {
        width: 54px;
        height: 54px;
        border-radius: 50%;
        background: #f1f5f9;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 1rem;
        color: #94a3b8;

        mat-icon {
          font-size: 28px;
          width: 28px;
          height: 28px;
        }
      }

      .empty-title {
        font-size: 0.95rem;
        font-weight: 700;
        color: #1e293b;
        margin-bottom: 0.35rem;
      }

      .empty-subtext {
        font-size: 0.82rem;
        color: #64748b;
        max-width: 380px;
      }
    }

    .table-footer-paginator {
      border-top: 1px solid #e2e8f0;
      background: #ffffff;

      ::ng-deep .mat-mdc-paginator-container {
        padding: 0 1rem;
        min-height: 48px;
        font-size: 0.82rem;
      }
    }
  `]
})
export class DataTableComponent implements OnChanges, AfterViewInit {
  private cdr = inject(ChangeDetectorRef);
  private dialog = inject(MatDialog);

  @Input() data: any[] = [];
  @Input() columns: TableColumn[] = [];
  @Input() showActions = true;
  @Input() showView = false;
  @Input() showEdit = true;
  @Input() showDelete = true;
  @Input() searchPlaceholder = 'Search records...';
  @Input() emptyMessage = 'No records found';
  @Input() requireDeleteConfirmation = true;
  @Input() deleteConfirmTitle = 'Confirm Delete';
  @Input() deleteConfirmMessage = 'Are you sure you want to delete this record? This action cannot be undone.';

  @Output() onView = new EventEmitter<any>();
  @Output() onEdit = new EventEmitter<any>();
  @Output() onDelete = new EventEmitter<any>();

  dataSource = new MatTableDataSource<any>();
  displayedColumns: string[] = [];
  filterValue = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.data) {
      this.dataSource.data = [...this.data];
      this.setupCustomFilter();
      if (this.paginator) {
        this.dataSource.paginator = this.paginator;
      }
      if (this.sort) {
        this.dataSource.sort = this.sort;
      }
      if (this.filterValue) {
        this.applyFilter(this.filterValue);
      }
      this.cdr.markForCheck();
    }
    if (changes['columns'] && this.columns) {
      this.displayedColumns = this.columns.map(c => c.def);
      if (this.showActions) {
        this.displayedColumns.push('actions');
      }
      this.setupCustomFilter();
      this.cdr.markForCheck();
    }
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    if (this.data && this.data.length > 0) {
      this.dataSource.data = [...this.data];
    }
    this.setupCustomFilter();
    this.cdr.detectChanges();
  }

  applyFilter(value: string): void {
    this.dataSource.filter = (value || '').trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  clearFilter(): void {
    this.filterValue = '';
    this.applyFilter('');
  }

  handleDeleteClick(element: any): void {
    if (!this.requireDeleteConfirmation) {
      this.onDelete.emit(element);
      return;
    }

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '420px',
      data: {
        title: this.deleteConfirmTitle,
        message: this.deleteConfirmMessage,
        confirmText: 'Delete',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.onDelete.emit(element);
      }
    });
  }

  private setupCustomFilter(): void {
    this.dataSource.filterPredicate = (data: any, filter: string): boolean => {
      if (!filter) return true;
      const term = filter.toLowerCase();

      // Check all defined columns via their cell extractors or raw properties
      for (const col of this.columns) {
        try {
          const val = col.cell ? col.cell(data) : data[col.def];
          if (val && String(val).toLowerCase().includes(term)) {
            return true;
          }
        } catch {
          // ignore error on cell accessor
        }
      }

      // Check direct object values
      for (const key of Object.keys(data)) {
        const val = data[key];
        if (val !== null && val !== undefined && String(val).toLowerCase().includes(term)) {
          return true;
        }
      }

      return false;
    };
  }
}
