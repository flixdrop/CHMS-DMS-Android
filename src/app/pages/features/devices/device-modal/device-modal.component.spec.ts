import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DeviceModalComponent } from './device-modal.component';

describe('DeviceModalComponent', () => {
  let component: DeviceModalComponent;
  let fixture: ComponentFixture<DeviceModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [DeviceModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DeviceModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
