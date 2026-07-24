import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { InseminationModalComponent } from './insemination-modal.component';

describe('InseminationModalComponent', () => {
  let component: InseminationModalComponent;
  let fixture: ComponentFixture<InseminationModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [InseminationModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(InseminationModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
