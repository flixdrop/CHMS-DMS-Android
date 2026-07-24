import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DryoffPage } from './dryoff.page';

describe('DryoffPage', () => {
  let component: DryoffPage;
  let fixture: ComponentFixture<DryoffPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DryoffPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
