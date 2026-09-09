import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CityService } from '../../services/city.service';
import { CityResponse } from '../../models/city.models';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class HomeComponent implements OnInit {
  searchForm: FormGroup;
  cities: CityResponse[] = [];
  minDate: Date = new Date(); // Today

  constructor(
    private fb: FormBuilder,
    private cityService: CityService,
    private router: Router
  ) {
    this.searchForm = this.fb.group({
      fromCityId: ['', Validators.required],
      toCityId: ['', Validators.required],
      journeyDate: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadCities();
  }

  loadCities(): void {
    this.cityService.getAllCities().subscribe({
      next: (res) => this.cities = res,
      error: (err) => console.error('Error fetching cities', err)
    });
  }

  onSearch(): void {
    if (this.searchForm.valid) {
      const formValue = this.searchForm.value;
      
      // Prevent searching if from and to cities are the same
      if (formValue.fromCityId === formValue.toCityId) {
        alert('Source and Destination cities cannot be the same.');
        return;
      }

      // Format date to YYYY-MM-DD
      const date = formValue.journeyDate;
      const formattedDate = date.getFullYear() + '-' + 
                            String(date.getMonth() + 1).padStart(2, '0') + '-' + 
                            String(date.getDate()).padStart(2, '0');

      this.router.navigate(['/search'], {
        queryParams: {
          from: formValue.fromCityId,
          to: formValue.toCityId,
          date: formattedDate
        }
      });
    } else {
      this.searchForm.markAllAsTouched();
    }
  }
}
