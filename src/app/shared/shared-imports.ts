// src/app/shared/shared-imports.ts
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { NgxPaginationModule } from 'ngx-pagination';

import { CustomHeaderComponent } from '../components/custom-header/custom-header.component';
import { CustomFooterComponent } from '../components/custom-footer/custom-footer.component';
import { UtcToIstPipe } from '../utils/pipes/utc-to-ist/utc-to-ist-pipe';

export const SharedImports = [
  CommonModule,
  RouterModule,
  FormsModule,
  ReactiveFormsModule,
  TranslateModule,
  NgxPaginationModule,

  // UI
  CustomHeaderComponent,
  CustomFooterComponent,

  // Pipes
  UtcToIstPipe,
];
