import { Component, inject, OnDestroy, OnInit, signal } from "@angular/core";
import { InputHandlerService } from "src/app/utils/input-handler/input-handler.service";
import { firstValueFrom, Subscription } from "rxjs";
import { EventUtilityService } from "src/app/utils/event-util/event-util.service";
import { SharedImportsModule } from "src/app/shared/shared-imports";
import { ColumnConfig } from "src/app/shared/interface";
import { AnimalModalComponent } from "./animal-modal/animal-modal.component";
import { ModalController, IonNote, IonImg } from "@ionic/angular/standalone";
import { AnimalService } from "src/app/services/animal/animal.service";
import { SystemService } from "src/app/services/system/system.service";
import { CustomHeaderComponent } from "src/app/components/custom-header/custom-header.component";

import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { FileOpener } from '@capacitor-community/file-opener';

@Component({
  selector: "app-animals",
  templateUrl: "./animals.page.html",
  styleUrls: ["./animals.page.scss"],
  standalone: true,
  imports: [CustomHeaderComponent, IonImg, SharedImportsModule, IonNote],
})
export class AnimalsPage implements OnInit, OnDestroy {
  private modalCtrl = inject(ModalController);

  results = signal<any[]>([]);
  isLoading = signal(false);
  isGeneratingFarmReport = signal(false);
  isGeneratingAnimalReportId = signal<string | null>(null); // Loader per animal

  totalCount = signal(0);
  p = signal(1);
  maxDate = new Date().toISOString();
  activeRange: number = 0.033;

  filter = { targetPath: '', farmId: '', search: '', startDate: '', endDate: '' };
  options = { limit: 10, offset: 0, sortBy: 'createdAt', sortOrder: -1 };

  private subs = new Subscription();

  public tableColumns: ColumnConfig[] = [
    { key: 'tagNo', label: 'Tag No. | Name', visible: true },
    { key: 'activeTag', label: 'Collar Tag', visible: true },
    { key: 'breed', label: 'Breed', visible: true },
    { key: 'sex', label: 'Sex', visible: true },
    { key: 'reproductionStatus', label: 'Reproduction Status', visible: true },
    { key: 'lastHeat', label: 'Last Heat', visible: true },
    { key: 'lastInsemination', label: 'Last Insemination', visible: true },
    { key: 'lastCalving', label: 'Last Calving', visible: true },
    { key: 'lastHealth', label: 'Last Health', visible: true },
    { key: 'currentLactation', label: 'Lactation', visible: true },
    { key: 'lactationStatus', label: 'Lactation Status', visible: true },
    { key: 'actions', label: 'Actions', visible: true }
  ];

  constructor(
    private systemService: SystemService,
    private animalService: AnimalService,
    private eventUtil: EventUtilityService,
    private inputHandler: InputHandlerService,
  ) { }

  ngOnInit() {
    const { targetPath, farmId } = this.eventUtil.getSavedSelections();
    this.filter.targetPath = targetPath;
    this.filter.farmId = farmId;

    this.activeRange = 0.033;
    const range = this.eventUtil.calculateRange(0.033);
    this.filter.startDate = range.start;
    this.filter.endDate = range.end;

    this.initSyncs();
    this.loadAnimals();
  }

  private initSyncs() {
    this.subs.add(this.inputHandler.getSearchStream(400).subscribe(term => {
      this.filter.search = term;
      this.refresh();
    }));

    this.subs.add(this.systemService.selectionChanged$.subscribe(() => {
      this.syncSelections();
      this.refresh();
    }));
  }

  async loadAnimals() {
    this.isLoading.set(true);
    this.options.offset = (this.p() - 1) * this.options.limit;

    try {
      const res = await firstValueFrom(this.animalService.getAnimals({
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

  // private downloadBase64Pdf(base64Data: string, fileName: string) {
  //   const byteCharacters = atob(base64Data);
  //   const byteNumbers = new Array(byteCharacters.length);

  //   for (let i = 0; i < byteCharacters.length; i++) {
  //     byteNumbers[i] = byteCharacters.charCodeAt(i);
  //   }

  //   const byteArray = new Uint8Array(byteNumbers);
  //   const blob = new Blob([byteArray], { type: 'application/pdf' });

  //   const blobUrl = URL.createObjectURL(blob);
  //   const a = document.createElement('a');
  //   a.href = blobUrl;
  //   a.download = fileName || 'document.pdf';
  //   a.click();

  //   // Clean up the URL object
  //   setTimeout(() => {
  //     URL.revokeObjectURL(blobUrl);
  //   }, 100);
  // }


  private async downloadBase64Pdf(base64Data: string, fileName: string) {
  const safeFileName = fileName || `Report_${Date.now()}.pdf`;

  if (Capacitor.isNativePlatform()) {
    // 📱 NATIVE MOBILE FLOW (Android & iOS)
    try {
      // 1. Save Base64 to device Cache Directory
      const savedFile = await Filesystem.writeFile({
        path: safeFileName,
        data: base64Data,
        directory: Directory.Cache,
      });

      // 2. Open file with native previewer
      await FileOpener.open({
        filePath: savedFile.uri,
        contentType: 'application/pdf',
        openWithDefault: true,
      });

    } catch (err) {
      console.error('❌ [MOBILE PDF] Error opening PDF on device:', err);
    }

  } else {
    // 🌐 WEB BROWSER FALLBACK
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/pdf' });

    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = safeFileName;
    a.click();

    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 500);
  }
}

  // 🌟 TRIGGER FULL FARM LEVEL REPORT GENERATION
  async downloadFarmReport() {
    // if (!this.filter.farmId && !this.filter.targetPath) return;
    this.isGeneratingFarmReport.set(true);
    try {
      const reportPayload = {
        farmId: this.filter.farmId,
        targetPath: this.filter.targetPath,
        startDate: this.filter.startDate,
        endDate: this.filter.endDate,
        selectedColumns: this.tableColumns.map(c => ({ key: c.key, visible: c.visible }))
      };

      const res = await firstValueFrom(this.animalService.fetchServerFarmReport(reportPayload));
      if (res?.fileBuffer) {
        this.downloadBase64Pdf(res.fileBuffer, res.fileName);
      }
    } catch (err) {
      console.error("Error generating farm report", err);
    } finally {
      this.isGeneratingFarmReport.set(false);
    }
  }

  // 🌟 TRIGGER INDIVIDUAL LIVECYCLE ANIMAL LEVEL PDF REPORT
  async downloadAnimalReport(animal: any) {
    if (!animal?.id) return;
    this.isGeneratingAnimalReportId.set(animal.id);
    try {
      const reportPayload = {
        farmId: this.filter.farmId,
        startDate: this.filter.startDate,
        endDate: this.filter.endDate
      };

      const res = await firstValueFrom(this.animalService.fetchServerAnimalReport(animal.id, reportPayload));
      if (res?.fileBuffer) {
        this.downloadBase64Pdf(res.fileBuffer, res.fileName);
      }
    } catch (err) {
      console.error("Error generating animal report", err);
    } finally {
      this.isGeneratingAnimalReportId.set(null);
    }
  }

  isColumnVisible(key: string): boolean {
    const col = this.tableColumns.find(c => c.key === key);
    return col ? col.visible : true;
  }

  toggleColumnVisibility(key: string): void {
    const col = this.tableColumns.find(c => c.key === key);
    if (col) {
      col.visible = !col.visible;
    }
  }

  refresh() { this.p.set(1); this.loadAnimals(); }

  onPageChange(page: number) { this.p.set(page); this.loadAnimals(); }

  handleInput(event: any) { this.inputHandler.search(event.detail.value); }

  toggleSort(column: string) {
    if (this.options.sortBy === column) {
      this.options.sortOrder = this.options.sortOrder === 1 ? -1 : 1;
    } else {
      this.options.sortBy = column;
      this.options.sortOrder = -1;
    }
    this.options.offset = 0;
    this.refresh();
  }

  setRange(months: number) {
    this.activeRange = months;
    const range = this.eventUtil.calculateRange(months);
    this.filter.startDate = range.start;
    this.filter.endDate = range.end;
  }

  clearDates() {
    this.activeRange = 0.033;
    this.setRange(0.033);
  }

  private syncSelections() {
    const { targetPath, farmId } = this.eventUtil.getSavedSelections();
    this.filter.targetPath = targetPath;
    this.filter.farmId = farmId;
  }

  ngOnDestroy() { this.subs.unsubscribe(); }

  async openAnimalModal(type: string, animal?: any) {
    const modal = await this.modalCtrl.create({
      component: AnimalModalComponent,
      componentProps: { type: type, animal: animal }
    });

    await modal.present();
    const { data, role } = await modal.onDidDismiss();

    if (role === 'confirm' && data?.updated) {
      this.refresh();
    }
  }

  // onClickSearchIcon(){
  //   if(this.isSearchbarVisible === false){
  //     this.isSearchbarVisible = true;
  //   }
  // }

  // onCloseSearchbar(){
  //   if(this.isSearchbarVisible === true){
  //     this.isSearchbarVisible = false;
  //   }
  // }
}