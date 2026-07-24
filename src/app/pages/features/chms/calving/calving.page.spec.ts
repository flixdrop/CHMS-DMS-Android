import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CalvingPage } from './calving.page';

describe('CalvingPage', () => {
  let component: CalvingPage;
  let fixture: ComponentFixture<CalvingPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CalvingPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
