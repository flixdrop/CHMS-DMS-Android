import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DairyPage } from './dairy.page';

describe('DairyPage', () => {
  let component: DairyPage;
  let fixture: ComponentFixture<DairyPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DairyPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
