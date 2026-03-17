import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AsideHome } from '../../components/aside-home/aside-home';
import { Header } from '../../components/header/header';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, AsideHome, Header],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.sass',
})
export class MainLayout {

}
