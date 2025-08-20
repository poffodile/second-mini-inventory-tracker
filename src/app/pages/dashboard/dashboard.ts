import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DataService } from '../../services/data';
import { Product } from '../../interfaceTypes/Product';
import { Movement } from '../../interfaceTypes/Movement';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  totalSkus: number = 0;
  totalOnHand: number = 0;
  lowStockCount: number = 0;
  inboundToday: number = 0;
  outboundToday: number = 0;
  recentMovements: Movement[] = [];

  constructor(private dataService: DataService) {
    this.refresh();
  }

  loadData(): void {
    this.dataService.loadDemoData();
    this.refresh();
    alert('Demo data loaded into LocalStorage!');
  }

  clearData(): void {
    this.dataService.clearAll();
    this.refresh();
    alert('LocalStorage cleared');
  }

  refresh(): void {
    const products = this.dataService.getData<Product>('products') || [];
    const ledger: Array<{ productId: string; locationId: string; qty: number; updatedAt?: string }> =
      this.dataService.getData('stockLedger') || [];
    const movements = this.dataService.getData<Movement>('movements') || [];

    this.totalSkus = products.length;
    this.totalOnHand = ledger.reduce((sum, row) => sum + (row.qty || 0), 0);
    this.lowStockCount = ledger.filter((row) => (row.qty || 0) <= 5).length;

    const today = new Date().toDateString();
    this.inboundToday = movements.filter(
      (m) => m.type === 'RECEIPT' && new Date(m.timestamp).toDateString() === today
    ).length;
    this.outboundToday = movements.filter(
      (m) => m.type === 'PICK' && new Date(m.timestamp).toDateString() === today
    ).length;

    this.recentMovements = [...movements]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
  }

  // ngOnInit(): void { dont  need this anymore as if  i used ngOnInit it would immediately
  //   this.loadData();  load the data, and i would no longer have contorol as to when i want the data to be loaded which is only ( onclick)
  // }
}
