import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { HealthModalComponent } from './health-modal.component';

describe('HealthModalComponent', () => {
  let component: HealthModalComponent;
  let fixture: ComponentFixture<HealthModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HealthModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HealthModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
