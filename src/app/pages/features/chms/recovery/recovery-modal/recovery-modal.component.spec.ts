import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { RecoveryModalComponent } from './recovery-modal.component';

describe('RecoveryModalComponent', () => {
  let component: RecoveryModalComponent;
  let fixture: ComponentFixture<RecoveryModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [RecoveryModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RecoveryModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
