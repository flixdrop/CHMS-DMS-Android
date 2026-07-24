import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CalvingModalComponent } from './calving-modal.component';

describe('CalvingModalComponent', () => {
  let component: CalvingModalComponent;
  let fixture: ComponentFixture<CalvingModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [CalvingModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CalvingModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
