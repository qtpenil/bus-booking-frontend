import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild, ChangeDetectorRef, inject, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface TableColumn {
  def: string;
  header: string;
  cell: (element: any) => string;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatPaginatorModule, MatSortModule, MatButtonModule, MatIconModule],
  template: `
    <div class="mat-elevation-z8">
      <table mat-table [dataSource]="dataSource" matSort>
        
        <ng-container *ngFor="let col of columns" [matColumnDef]="col.def">
          <th mat-header-cell *matHeaderCellDef mat-sort-header> {{col.header}} </th>
          <td mat-cell *matCellDef="let element"> {{col.cell(element)}} </td>
        </ng-container>

        <!-- Actions Column -->
        <ng-container matColumnDef="actions" *ngIf="showActions">
          <th mat-header-cell *matHeaderCellDef> Actions </th>
          <td mat-cell *matCellDef="let element">
            <button mat-icon-button color="accent" *ngIf="showView" (click)="onView.emit(element)" title="View Details">
              <mat-icon>visibility</mat-icon>
            </button>
            <button mat-icon-button color="primary" *ngIf="showEdit" (click)="onEdit.emit(element)" title="Edit">
              <mat-icon>edit</mat-icon>
            </button>
            <button mat-icon-button color="warn" *ngIf="showDelete" (click)="onDelete.emit(element)" title="Delete">
              <mat-icon>delete</mat-icon>
            </button>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
      </table>

      <mat-paginator [pageSizeOptions]="[5, 10, 20]" showFirstLastButtons></mat-paginator>
    </div>
  `
})
export class DataTableComponent implements OnChanges, AfterViewInit {
  private cdr = inject(ChangeDetectorRef);

  @Input() data: any[] = [];
  @Input() columns: TableColumn[] = [];
  @Input() showActions = true;
  @Input() showView = false;
  @Input() showEdit = true;
  @Input() showDelete = true;

  @Output() onView = new EventEmitter<any>();
  @Output() onEdit = new EventEmitter<any>();
  @Output() onDelete = new EventEmitter<any>();

  dataSource = new MatTableDataSource<any>();
  displayedColumns: string[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.data) {
      this.dataSource.data = [...this.data];
      if (this.paginator) {
        this.dataSource.paginator = this.paginator;
      }
      if (this.sort) {
        this.dataSource.sort = this.sort;
      }
      this.cdr.markForCheck();
    }
    if (changes['columns'] && this.columns) {
      this.displayedColumns = this.columns.map(c => c.def);
      if (this.showActions) {
        this.displayedColumns.push('actions');
      }
      this.cdr.markForCheck();
    }
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    if (this.data && this.data.length > 0) {
      this.dataSource.data = [...this.data];
    }
    this.cdr.detectChanges();
  }
}
