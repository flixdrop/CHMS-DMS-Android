import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { SharedImportsModule } from 'src/app/shared/shared-imports';
import { Subscription, firstValueFrom } from 'rxjs';
import { EventUtilityService } from 'src/app/utils/event-util/event-util.service';
import { InputHandlerService } from 'src/app/utils/input-handler/input-handler.service';
import { ColumnConfig } from 'src/app/shared/interface';
import { RecoveryModalComponent } from './recovery-modal/recovery-modal.component';
import { ModalController, IonText, IonImg, IonRange } from '@ionic/angular/standalone';
import { CattleMonitoringService } from 'src/app/services/chms/chms.service';
import { SystemService } from 'src/app/services/system/system.service';
import { environment } from 'src/environments/environment';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CustomHeaderComponent } from "src/app/components/custom-header/custom-header.component";

@Component({
  selector: 'app-recovery',
  templateUrl: './recovery.page.html',
  styleUrls: ['./recovery.page.scss'],
  standalone: true,
  imports: [IonRange, IonImg, SharedImportsModule, IonText, CustomHeaderComponent]
})
export class RecoveryPage implements OnInit, OnDestroy {
  private modalCtrl = inject(ModalController);

  // Use SafeResourceUrl type
  trustedUrl!: SafeResourceUrl; 
  rawUrl: string = environment.server.url;
  activePreviews = new Set<any>();

  // UI State Signals
  results = signal<any[]>([]);
  isLoading = signal(false);
  totalCount = signal(0);
  p = signal(1);
  maxDate = new Date().toISOString();
  activeRange: number = 0.033;

  // Logic Objects (Matches Backend Inputs)
  filter = { targetPath: '', farmId: '', search: '', startDate: '', endDate: '' };
  options = { limit: 10, offset: 0, sortBy: 'occurredAt', sortOrder: -1 };
  

   // 🟢 FRONTEND PRESENTATION MATRIX FOR CUSTOM HIDING/SHOWING
public tableColumns: ColumnConfig[] = [
  { key: 'tagNo', label: 'Tag No. | Name', visible: true },
  { key: 'deviceNo', label: 'Collar Tag', visible: true },
  { key: 'intensity', label: 'Intensity', visible: true },
  { key: 'detected', label: 'Detected', visible: true },
  { key: 'window', label: 'Event Window', visible: true },
  { key: 'actions', label: 'Actions', visible: true }
];

  private subs = new Subscription();

  constructor(
    private systemService: SystemService,
    private chmsService: CattleMonitoringService,
    private eventUtil: EventUtilityService,
    private inputHandler: InputHandlerService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit() {

    this.trustedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.rawUrl);

    this.syncSelections();

    // this.activeRange = 0.033; // Reset to 'All' or a null state
    // this.setRange(0.033); // Initial load (1 Day)
    // this.setRange(-1);

    this.initSyncs();
  }

  toggleInlinePreview(item: any, event: Event) {
  event.stopPropagation(); // Stop table row click events
  
  if (this.activePreviews.has(item)) {
    this.activePreviews.delete(item); // Close it if it's already open
  } else {
    this.activePreviews.add(item);    // Open it
  }
}

// Helper method to check if the preview is visible
isPreviewOpen(item: any): boolean {
  return this.activePreviews.has(item);
}

// Update the close action method too
closePreview(item: any, event: Event) {
  event.stopPropagation();
  this.activePreviews.delete(item);
}

  getSafeUrl(url: string): SafeResourceUrl {
    // This allows both web https:// URLs and Capacitor native filesystem file:// URLs to render safely
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  isImageFile(url: string): boolean {
    if (!url) return false;
    const lower = url.toLowerCase();
    return lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.webp') || url.startsWith('data:image');
  }

  private initSyncs() {
    // 1. Debounced Search Sync
    this.subs.add(this.inputHandler.getSearchStream(400).subscribe(term => {
      this.filter.search = term;
      this.refresh();
    }));

    // 2. Global Branch/Farm Selection Sync
    this.subs.add(this.systemService.selectionChanged$.subscribe(() => {
      this.syncSelections();
      this.refresh();
    }));
  }

  async loadRecoveries() {
    this.isLoading.set(true);
    this.options.offset = (this.p() - 1) * this.options.limit;

    try {
      const res = await firstValueFrom(this.chmsService.getRecoveries({
        filter: this.filter,
        options: this.options
      }));
      this.results.set(res?.items ?? []);
      this.totalCount.set(res?.totalCount ?? 0);
    } catch {
      this.results.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  
  // 🟢 COLUMN VISIBILITY CHECKER HELPER
  isColumnVisible(key: string): boolean {
    const col = this.tableColumns.find(c => c.key === key);
    return col ? col.visible : true;
  }

  // 🟢 TOGGLE COLUMN VISIBILITY
  toggleColumnVisibility(key: string): void {
    const col = this.tableColumns.find(c => c.key === key);
    if (col) {
      col.visible = !col.visible;
    }
  }

  // --- UI Action Handlers ---

  refresh() { this.p.set(1); this.loadRecoveries(); }

  onPageChange(page: number) { this.p.set(page); this.loadRecoveries(); }

  handleInput(event: any) { this.inputHandler.search(event.detail.value); }

  toggleSort(column: string) {
    this.options.sortOrder = (this.options.sortBy === column) ? (this.options.sortOrder * -1) : -1;
    this.options.sortBy = column;
    this.refresh();
  }

  setRange(months: number) {
    // this.activeRange = months;
    // const range = this.eventUtil.calculateRange(months);
    // this.filter.startDate = range.start;
    // this.filter.endDate = range.end;
    this.refresh();
  }

  clearDates() {
    // this.activeRange = 0.033; // Reset to 'All' or a null state
    // this.setRange(0.033);
    // this.setRange(-1); 
  }

  private syncSelections() {
    const { targetPath, farmId } = this.eventUtil.getSavedSelections();
    this.filter.targetPath = targetPath;
    this.filter.farmId = farmId;
  }

  ngOnDestroy() { this.subs.unsubscribe(); }


  // Add these utility methods inside your table's parent component class

/**
 * Validates if the file is an image format
 */
// public isImageFile(filePath: string): boolean {
//   if (!filePath) return false;
//   const extension = filePath.split('.').pop()?.toLowerCase();
//   return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '');
// }

/**
 * Selects an appropriate layout icon based on the file extension match
 */
public getFileIcon(filePath: string): string {
  if (!filePath) return 'document-outline';
  const extension = filePath.split('.').pop()?.toLowerCase();
  
  switch(extension) {
    case 'pdf': return 'document-text';
    case 'xls':
    case 'xlsx': return 'grid';
    case 'doc':
    case 'docx': return 'reader';
    case 'html': return 'code-working';
    default: return 'download';
  }
}

/**
 * Resolves the relative path into an absolute server URL string
 */
public getAbsoluteFileUrl(relativeRef: string): string {
  const backendHost = 'http://localhost:5000'; // Replace with your standard backend address variable
  return relativeRef.startsWith('http') ? relativeRef : `${backendHost}${relativeRef}`;
}

// /**
//  * Directs the browser or web view to securely open or fetch the target file path
//  */
// public openAttachment(relativeRef: string, event: Event): void {
//   event.stopPropagation(); // Prevents row selection bubbling issues if present
//   const absoluteUrl = this.getAbsoluteFileUrl(relativeRef);
//   window.open(absoluteUrl, '_blank');
// }

// 1. Ensure you have the chmsService or standard GraphQL collection injected into your table view
// constructor(private chmsService: CattleMonitoringService) {}

public async openAttachment(relativeRef: string, event: Event): Promise<void> {
  event.stopPropagation();

  try {
    // 1. Fetch file data straight from your Apollo Standalone GraphQL Service
    // Adjust the service call wrapper down below to match your precise client architecture mapping
    const response: any = await firstValueFrom(this.chmsService.getPrescriptionAttachment(relativeRef));
    
    if (!response || !response.success) {
      console.error("File generation rejected:", response?.message);
      return;
    }

    const { base64Data, mimeType, filename } = response;

    // 2. Transcode the clean base64 data back into standard raw binary bytes
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    
    // 3. Construct a virtual Blob asset inside the browser context runtime
    const binaryBlob = new Blob([byteArray], { type: mimeType });
    const virtualBlobUrl = URL.createObjectURL(binaryBlob);

    // 4. Handle clean viewport display maps depending on structural type configurations
    if (mimeType === 'text/html' || mimeType.startsWith('image/') || mimeType === 'application/pdf') {
      // Images, HTML pages, and PDFs open cleanly inside standard interactive navigation tabs
      window.open(virtualBlobUrl, '_blank');
    } else {
      // Excel sheets and raw text files drop directly into background system download pipelines cleanly
      const anchorElement = document.createElement('a');
      anchorElement.href = virtualBlobUrl;
      anchorElement.download = filename || 'attachment';
      document.body.appendChild(anchorElement);
      anchorElement.click();
      document.body.removeChild(anchorElement);
    }

    // Free memory space mapping bounds dynamically
    setTimeout(() => URL.revokeObjectURL(virtualBlobUrl), 10000);

  } catch (error) {
    console.error("Error building frontend attachment view path:", error);
  }
}

   async openRecoveryModal(type: string, recovery?: any) {
      const modal = await this.modalCtrl.create({
        component: RecoveryModalComponent, // This should be your actual modal component
        // 🌟 Pass data into the Modal component's @Input fields
        componentProps: {
          type: type,
          recovery: recovery // Pass the recovery data for edit/delete, or null for create
        }
      });
  
      await modal.present();
  
      // 🌟 Listen for the response data payload when modal closes
      const { data, role } = await modal.onDidDismiss();
  
      if (role === 'confirm' && data?.updated) {
        console.log('Received updated data from modal:', data);
        this.refresh();
        // Trigger table refresh or update state here!
      }
    }
}
