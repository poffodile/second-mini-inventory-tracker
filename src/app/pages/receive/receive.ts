import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data';
import { ReceivedItem } from '../../interfaceTypes/ReceivedItem';
import { Movement } from '../../interfaceTypes/Movement';

@Component({
  selector: 'app-receive',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './receive.html',
  styleUrls: ['./receive.css'],
})
export class Receive implements OnInit {
  products: any[] = [];
  locations: any[] = [];
  receivedItems: ReceivedItem[] = [];
  summarySortField: keyof ReceivedItem | '' = '';
  summarySortDirection: 'asc' | 'desc' = 'asc';
  summaryFilterText: string = '';
  filteredSummary: ReceivedItem[] = [];

  productId: string = '';
  quantity: number = 1;
  locationId: string = '';

  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    this.products = this.dataService.getData('products') || [];
    this.locations = this.dataService.getData('locations') || [];

    // Preload summary from receipt movements so persisted history appears
    const movements = this.dataService.getData<Movement>('movements') || [];
    const receipts = movements.filter((m) => m.type === 'RECEIPT');
    this.receivedItems = receipts.map((m) => ({
      productId: m.productId,
      quantity: m.qty,
      locationId: m.toLocationId || '',
      timestamp: m.timestamp,
      toLocationId: m.toLocationId || '',
      fromLocationId: m.fromLocationId,
      qty: m.qty,
    }));
    this.applySummaryFilters();
  }

  submitForm(): void {
    const now = new Date().toISOString();

    // 1) Append a movement entry (so Stock Received page shows it)
    const newMovement: Movement = {
      id: 'M' + Date.now(),
      type: 'RECEIPT',
      productId: this.productId,
      toLocationId: this.locationId,
      qty: this.quantity,
      ref: 'RECEIVE',
      timestamp: now,
    };
    const movements = this.dataService.getData<Movement>('movements') || [];
    movements.push(newMovement);
    this.dataService.setData('movements', movements);

    // 2) Update stock ledger totals (aggregate by product+location)
    const ledger: any[] = this.dataService.getData('stockLedger') || [];
    const idx = ledger.findIndex(
      (e) => e.productId === this.productId && e.locationId === this.locationId
    );
    if (idx !== -1) {
      ledger[idx] = {
        ...ledger[idx],
        qty: (ledger[idx].qty || 0) + this.quantity,
        updatedAt: now,
      };
    } else {
      ledger.push({
        productId: this.productId,
        locationId: this.locationId,
        qty: this.quantity,
        updatedAt: now,
      });
    }
    this.dataService.setData('stockLedger', ledger);

    // 3) Immediately reflect in the on-page summary
    const added = {
      productId: this.productId,
      quantity: this.quantity,
      locationId: this.locationId,
      timestamp: now,
      toLocationId: this.locationId,
      qty: this.quantity,
    } as ReceivedItem;
    this.receivedItems.unshift(added);
    this.applySummaryFilters();

    alert('Goods received and recorded!');
    this.resetForm();
  }

  resetForm(): void {
    this.productId = '';
    this.quantity = 1;
    this.locationId = '';
  }

  sortSummary(field: keyof ReceivedItem): void {
    if (this.summarySortField === field) {
      this.summarySortDirection = this.summarySortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.summarySortField = field;
      this.summarySortDirection = 'asc';
    }

    this.filteredSummary.sort((a, b) => {
      const aValue = a[field];
      const bValue = b[field];

      if (aValue == null || bValue == null) return 0;

      const aStr = aValue.toString().toLowerCase();
      const bStr = bValue.toString().toLowerCase();

      if (aStr < bStr) return this.summarySortDirection === 'asc' ? -1 : 1;
      if (aStr > bStr) return this.summarySortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  applySummaryFilters(): void {
    const text = this.summaryFilterText.trim().toLowerCase();
    if (!text) {
      this.filteredSummary = [...this.receivedItems];
    } else {
      this.filteredSummary = this.receivedItems.filter((i) => {
        const productMatch = i.productId.toLowerCase().includes(text);
        const locationMatch = i.locationId.toLowerCase().includes(text);
        const qtyMatch = String(i.quantity ?? '').toLowerCase().includes(text);
        const timeMatch = (i.timestamp || '').toLowerCase().includes(text);
        return productMatch || locationMatch || qtyMatch || timeMatch;
      });
    }

    if (this.summarySortField) {
      this.sortSummary(this.summarySortField as keyof ReceivedItem);
    }
  }

  onSummarySortFieldChange(field: string): void {
    this.summarySortField = (field as keyof ReceivedItem) || '';
    if (this.summarySortField) {
      this.sortSummary(this.summarySortField as keyof ReceivedItem);
    }
  }

  onSummarySortDirectionChange(direction: 'asc' | 'desc'): void {
    this.summarySortDirection = direction;
    if (this.summarySortField) {
      this.sortSummary(this.summarySortField as keyof ReceivedItem);
    }
  }

  clearSummaryFilters(): void {
    this.summaryFilterText = '';
    this.summarySortField = '';
    this.summarySortDirection = 'asc';
    this.applySummaryFilters();
  }
}
