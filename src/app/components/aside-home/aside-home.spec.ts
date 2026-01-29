import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AsideHome } from './aside-home';

describe('AsideHome', () => {
  let component: AsideHome;
  let fixture: ComponentFixture<AsideHome>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AsideHome]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AsideHome);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
