import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data';
import { Movement } from '../../interfaceTypes/Movement';

@Component({
  selector: 'app-stock-received',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './stockReceived.html',
  styleUrls: ['./stockReceived.css'],
})
export class StockReceived implements OnInit {
  sortedItems: Movement[] = [];
  receivedItems: Movement[] = [];

  sortField: keyof Movement | '' = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  filterText: string = '';

  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    const allMovements = this.dataService.getData<Movement>('movements');
    this.receivedItems = allMovements.filter((m) => m.type === 'RECEIPT');
    this.applyFilters();
  }

  sort(field: keyof Movement): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }

    this.sortedItems.sort((a, b) => {
      const aValue = a[field];
      const bValue = b[field];

      if (aValue === undefined || bValue === undefined) return 0;

      const aStr = aValue.toString().toLowerCase();
      const bStr = bValue.toString().toLowerCase();

      if (aStr < bStr) return this.sortDirection === 'asc' ? -1 : 1;
      if (aStr > bStr) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  applyFilters(): void {
    const text = this.filterText.trim().toLowerCase();
    if (!text) {
      this.sortedItems = [...this.receivedItems];
    } else {
      this.sortedItems = this.receivedItems.filter((m) => {
        const productMatch = m.productId.toLowerCase().includes(text);
        const locationMatch = (m.toLocationId || '').toLowerCase().includes(text);
        const qtyMatch = String(m.qty ?? '').toLowerCase().includes(text);
        const timeMatch = (m.timestamp || '').toLowerCase().includes(text);
        return productMatch || locationMatch || qtyMatch || timeMatch;
      });
    }

    if (this.sortField) {
      this.sort(this.sortField as keyof Movement);
    }
  }

  onSortFieldChange(field: string): void {
    this.sortField = (field as keyof Movement) || '';
    this.applyFilters();
  }

  onSortDirectionChange(direction: 'asc' | 'desc'): void {
    this.sortDirection = direction;
    if (this.sortField) {
      this.sort(this.sortField as keyof Movement);
    }
  }

  clearFilters(): void {
    this.filterText = '';
    this.sortField = '';
    this.sortDirection = 'asc';
    this.applyFilters();
  }
}
