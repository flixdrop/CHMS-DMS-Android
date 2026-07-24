import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DairyModalComponent } from './dairy-modal.component';

describe('DairyModalComponent', () => {
  let component: DairyModalComponent;
  let fixture: ComponentFixture<DairyModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [DairyModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DairyModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
