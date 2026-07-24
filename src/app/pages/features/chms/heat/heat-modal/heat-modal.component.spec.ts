import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { HeatModalComponent } from './heat-modal.component';

describe('HeatModalComponent', () => {
  let component: HeatModalComponent;
  let fixture: ComponentFixture<HeatModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HeatModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HeatModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
