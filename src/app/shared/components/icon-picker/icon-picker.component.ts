import { Component, Input, Output, EventEmitter } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { ICON_OPTIONS } from '../../constants/icon-options';

@Component({
  selector: 'app-icon-picker',
  standalone: true,
  imports: [IonIcon],
  templateUrl: './icon-picker.component.html',
  styleUrls: ['./icon-picker.component.scss'],
})
export class IconPickerComponent {
  @Input() value = '';
  @Output() valueChange = new EventEmitter<string>();

  readonly options = ICON_OPTIONS;

  select(icon: string): void {
    this.valueChange.emit(icon);
  }
}
