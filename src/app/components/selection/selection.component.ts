// import { RouterModule } from '@angular/router';
// import { Component, OnInit } from '@angular/core';
// import { firstValueFrom } from 'rxjs';
// import {
//   IonModal,
//   IonSearchbar,
//   IonItem,
//   IonLabel,
//   IonHeader,
//   IonToolbar,
//   IonTitle,
//   IonButtons,
//   IonButton,
//   IonContent,
//   IonList,
//   IonIcon,
//   ActionSheetController,
//   ActionSheetButton,
//   IonPopover,
// } from '@ionic/angular/standalone';
// import { TranslateModule, TranslateService } from '@ngx-translate/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule, ReactiveFormsModule } from '@angular/forms';
// import { Apollo } from 'apollo-angular';
// import {
//   ACCOUNT_HOLDERS_LIST,
//   MANAGED_FARMS_LIST,
//   MANAGED_USERS_LIST,
// } from 'src/app/graphql/queries/system.queries';
// import { SystemService } from 'src/app/services/system/system.service';

// @Component({
//   selector: 'app-selection',
//   templateUrl: './selection.component.html',
//   styleUrls: ['./selection.component.scss'],
//   standalone: true,
//   imports: [
//     IonPopover,
//     CommonModule,
//     FormsModule,
//     RouterModule,
//     ReactiveFormsModule,
//     TranslateModule,
//     IonItem,
//     IonLabel,
//     IonModal,
//     IonSearchbar,
//     IonHeader,
//     IonToolbar,
//     IonTitle,
//     IonButtons,
//     IonButton,
//     IonContent,
//     IonList,
//     IonIcon,
//   ],
// })
// export class SelectionComponent implements OnInit {
//   isLoading: boolean = true;
//   results: any[] = [];
//   animals: any[] = [];
//   p: number = 1;
//   totalCount: number = 0;
//   pageSize: number = 1000;
//   searchTerm: string = '';

//   selections = {
//     primary: '',
//     managed: '',
//     farm: '',
//   };

//   users: any[] = [];
//   managed_users: any[] = [];
//   farms: any[] = [];

//   auth_user: any = null;

//   filteredUsers: any[] = [];
//   filteredManaged: any[] = [];
//   filteredFarms: any[] = [];

//   language: string = 'en';

//   constructor(
//     private apollo: Apollo,
//     private translateService: TranslateService,
//     private systemService: SystemService
//   ) {
//     this.translateService.setDefaultLang('en');
//     this.translateService.use(
//       localStorage.getItem('chms-dms.web.language') || 'en'
//     );
//     this.language = localStorage.getItem('chms-dms.web.language') || 'en';
//   }

//   async ngOnInit() {
//     const user = localStorage.getItem('chms-dms.mobile.user');

//     if (user) {
//       this.auth_user = JSON.parse(user);
//     }

//     const saved = localStorage.getItem('chms-dms.web.selected_options');
//     if (saved) {
//       this.selections = JSON.parse(saved);
//     }

//     await this.loadPrimaryUsers();
//     await this.refreshData();

//     this.isLoading = false;
//   }

//   getLabel(type: 'primary' | 'managed' | 'farm'): string {
//     const val = this.selections[type];

//     if (!val) {
//       if (type === 'primary') return 'All Admins';
//       if (type === 'managed') return 'All Managed Users';
//       return 'All Branch Farms';
//     }

//     if (type === 'primary') {
//       const user = this.users.find((u) => u.path + u.id + ',' === val);
//       return user ? user.username : 'All Admins';
//     }

//     if (type === 'managed') {
//       return (
//         this.managed_users.find((u) => u.path + u.id + ',' === val)?.username ||
//         'All Managed Users'
//       );
//     }

//     if (type === 'farm') {
//       return this.farms.find((f) => f.id === val)?.name || 'All Branch Farms';
//     }
//     return '';
//   }

//   selectItem(
//     type: 'primary' | 'managed' | 'farm',
//     val: string,
//     popover: IonPopover
//   ) {
//     this.selections[type] = val;
//     this.onSelectionChange(type);
//     if (popover) {
//       popover.dismiss();
//     }
//   }

//   onSelectionChange(type: 'primary' | 'managed' | 'farm') {
//     if (type === 'primary') {
//       this.selections.managed = '';
//       this.selections.farm = '';
//     }
//     if (type === 'managed') {
//       this.selections.farm = '';
//     }
//     localStorage.setItem(
//       'chms-dms.web.selected_options',
//       JSON.stringify(this.selections)
//     );
//     this.refreshData();

//     // Notify downstream pages (AnimalsPage / HeatsPage) to reload their data sets
//     this.systemService.notifySelectionChanged();
//   }

//   async refreshData() {
//     this.isLoading = true;

//     // 🟢 Fixed: Changed from legacy mongo '_id' to contract-aligned 'id' property mapping
//     const authPath = this.auth_user
//       ? `${this.auth_user.path}${this.auth_user.id},`
//       : '';

//     const currentPath =
//       this.selections.managed || this.selections.primary || authPath;

//     await this.loadManagedUsers(this.selections.primary);
//     await this.loadFarms(currentPath);

//     this.isLoading = false;
//   }

//   handleSearch(event: any, type: 'primary' | 'managed' | 'farm') {
//     const query = event.target.value.toLowerCase();
//     if (type === 'primary') {
//       this.filteredUsers = this.users.filter((u) =>
//         u.username.toLowerCase().includes(query)
//       );
//     } else if (type === 'managed') {
//       this.filteredManaged = this.managed_users.filter((u) =>
//         u.username.toLowerCase().includes(query)
//       );
//     } else if (type === 'farm') {
//       this.filteredFarms = this.farms.filter((f) =>
//         f.name.toLowerCase().includes(query)
//       );
//     }
//   }

//   async loadPrimaryUsers() {
//     try {
//       const result = await firstValueFrom(
//         this.apollo.query<any>({
//           query: ACCOUNT_HOLDERS_LIST,
//           variables: { targetTier: 2 },
//         })
//       );
//       this.users = result.data?.getAccountHolders || [];
//       this.filteredUsers = [...this.users];
//     } catch (err) {
//       this.users = [];
//       this.filteredUsers = [];
//     }
//   }

//   async loadManagedUsers(path: string) {
//     try {
//       const result = await firstValueFrom(
//         this.apollo.query<any>({
//           query: MANAGED_USERS_LIST,
//           variables: { parentPath: path || '' },
//         })
//       );
//       this.managed_users = result.data?.getManagedUsers || [];
//       this.filteredManaged = [...this.managed_users];
//     } catch (error) {
//       this.managed_users = [];
//       this.filteredManaged = [];
//     }
//   }

//   async loadFarms(path: string) {
//     try {
//       const result = await firstValueFrom(
//         this.apollo.query<any>({
//           query: MANAGED_FARMS_LIST,
//           variables: { targetPath: path || '' },
//         })
//       );
//       this.farms = result.data?.getManagedFarms || [];
//       this.filteredFarms = [...this.farms];
//     } catch (error) {
//       this.farms = [];
//       this.filteredFarms = [];
//     }
//   }

//   resetFilters(type: 'primary' | 'managed' | 'farm') {
//     if (type === 'primary') {
//       this.filteredUsers = [...this.users];
//     } else if (type === 'managed') {
//       this.filteredManaged = [...this.managed_users];
//     } else if (type === 'farm') {
//       this.filteredFarms = [...this.farms];
//     }
//   }
// }




import { RouterModule } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  IonModal,
  IonSearchbar,
  IonItem,
  IonLabel,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonList,
  IonIcon,
  IonPopover,
} from '@ionic/angular/standalone';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Apollo } from 'apollo-angular';
import {
  ACCOUNT_HOLDERS_LIST,
  MANAGED_FARMS_LIST,
  MANAGED_USERS_LIST,
} from 'src/app/graphql/queries/system.queries';
import { SystemService } from 'src/app/services/system/system.service';

@Component({
  selector: 'app-selection',
  templateUrl: './selection.component.html',
  styleUrls: ['./selection.component.scss'],
  standalone: true,
  imports: [
    IonPopover,
    CommonModule,
    FormsModule,
    RouterModule,
    ReactiveFormsModule,
    TranslateModule,
    IonItem,
    IonLabel,
    IonModal,
    IonSearchbar,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonList,
    IonIcon,
  ],
})
export class SelectionComponent implements OnInit {
  isLoading: boolean = true;
  
  // Independent Tier Loading Flags
  isPrimaryLoading: boolean = false;
  isManagedLoading: boolean = false;
  isFarmLoading: boolean = false;

  results: any[] = [];
  animals: any[] = [];
  p: number = 1;
  totalCount: number = 0;
  pageSize: number = 1000;
  searchTerm: string = '';

  selections = {
    primary: '',
    managed: '',
    farm: '',
  };

  users: any[] = [];
  managed_users: any[] = [];
  farms: any[] = [];

  auth_user: any = null;

  filteredUsers: any[] = [];
  filteredManaged: any[] = [];
  filteredFarms: any[] = [];

  language: string = 'en';

  constructor(
    private apollo: Apollo,
    private translateService: TranslateService,
    private systemService: SystemService
  ) {
    this.translateService.setDefaultLang('en');
    this.translateService.use(
      localStorage.getItem('chms-dms.web.language') || 'en'
    );
    this.language = localStorage.getItem('chms-dms.web.language') || 'en';
  }

  async ngOnInit() {
    const user = localStorage.getItem('chms-dms.mobile.user');

    if (user) {
      this.auth_user = JSON.parse(user);
    }

    const saved = localStorage.getItem('chms-dms.web.selected_options');
    if (saved) {
      this.selections = JSON.parse(saved);
    }

    // Load initial configurations sequentially
    await this.loadPrimaryUsers();
    await this.refreshData();

    this.isLoading = false;
  }

  getLabel(type: 'primary' | 'managed' | 'farm'): string {
    const val = this.selections[type];

    if (!val) {
      if (type === 'primary') return 'All Admins';
      if (type === 'managed') return 'All Managed Users';
      return 'All Branch Farms';
    }

    if (type === 'primary') {
      const user = this.users.find((u) => u.path + u.id + ',' === val);
      return user ? user.username : 'All Admins';
    }

    if (type === 'managed') {
      return (
        this.managed_users.find((u) => u.path + u.id + ',' === val)?.username ||
        'All Managed Users'
      );
    }

    if (type === 'farm') {
      return this.farms.find((f) => f.id === val)?.name || 'All Branch Farms';
    }
    return '';
  }

  selectItem(
    type: 'primary' | 'managed' | 'farm',
    val: string,
    popover: IonPopover
  ) {
    this.selections[type] = val;
    this.onSelectionChange(type);
    if (popover) {
      popover.dismiss();
    }
  }

  onSelectionChange(type: 'primary' | 'managed' | 'farm') {
    if (type === 'primary') {
      this.selections.managed = '';
      this.selections.farm = '';
    }
    if (type === 'managed') {
      this.selections.farm = '';
    }
    localStorage.setItem(
      'chms-dms.web.selected_options',
      JSON.stringify(this.selections)
    );
    this.refreshData();

    this.systemService.notifySelectionChanged();
  }

  async refreshData() {
    this.isLoading = true;

    const authPath = this.auth_user
      ? `${this.auth_user.path}${this.auth_user.id},`
      : '';

    const currentPath =
      this.selections.managed || this.selections.primary || authPath;

    // Load dependent trees in parallel to maintain asynchronous structural responsiveness
    await Promise.all([
      this.loadManagedUsers(this.selections.primary),
      this.loadFarms(currentPath)
    ]);

    this.isLoading = false;
  }

  handleSearch(event: any, type: 'primary' | 'managed' | 'farm') {
    const query = event.target.value.toLowerCase();
    if (type === 'primary') {
      this.filteredUsers = this.users.filter((u) =>
        u.username.toLowerCase().includes(query)
      );
    } else if (type === 'managed') {
      this.filteredManaged = this.managed_users.filter((u) =>
        u.username.toLowerCase().includes(query)
      );
    } else if (type === 'farm') {
      this.filteredFarms = this.farms.filter((f) =>
        f.name.toLowerCase().includes(query)
      );
    }
  }

  async loadPrimaryUsers() {
    this.isPrimaryLoading = true;
    try {
      const result = await firstValueFrom(
        this.apollo.query<any>({
          query: ACCOUNT_HOLDERS_LIST,
          variables: { targetTier: 2 },
        })
      );
      this.users = result.data?.getAccountHolders || [];
      this.filteredUsers = [...this.users];
    } catch (err) {
      this.users = [];
      this.filteredUsers = [];
    } finally {
      this.isPrimaryLoading = false;
    }
  }

  async loadManagedUsers(path: string) {
    this.isManagedLoading = true;
    try {
      const result = await firstValueFrom(
        this.apollo.query<any>({
          query: MANAGED_USERS_LIST,
          variables: { parentPath: path || '' },
        })
      );
      this.managed_users = result.data?.getManagedUsers || [];
      this.filteredManaged = [...this.managed_users];
    } catch (error) {
      this.managed_users = [];
      this.filteredManaged = [];
    } finally {
      this.isManagedLoading = false;
    }
  }

  async loadFarms(path: string) {
    this.isFarmLoading = true;
    try {
      const result = await firstValueFrom(
        this.apollo.query<any>({
          query: MANAGED_FARMS_LIST,
          variables: { targetPath: path || '' },
        })
      );
      this.farms = result.data?.getManagedFarms || [];
      this.filteredFarms = [...this.farms];
    } catch (error) {
      this.farms = [];
      this.filteredFarms = [];
    } finally {
      this.isFarmLoading = false;
    }
  }

  resetFilters(type: 'primary' | 'managed' | 'farm') {
    if (type === 'primary') {
      this.filteredUsers = [...this.users];
    } else if (type === 'managed') {
      this.filteredManaged = [...this.managed_users];
    } else if (type === 'farm') {
      this.filteredFarms = [...this.farms];
    }
  }
}