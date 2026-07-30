import { Component, ElementRef, HostBinding, HostListener, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';

const ACTION_WIDTH = 72;
const OPEN_THRESHOLD = ACTION_WIDTH / 2;
const AXIS_LOCK_THRESHOLD = 6;
const OVERDRAG_RESISTANCE = 0.3;
const MAX_OVERDRAG = 24;

@Component({
  selector: 'app-swipeable-card',
  standalone: true,
  imports: [IonIcon],
  templateUrl: './swipeable-card.component.html',
  styleUrls: ['./swipeable-card.component.scss'],
})
export class SwipeableCardComponent {
  @Output() readonly delete = new EventEmitter<void>();
  @Output() readonly more = new EventEmitter<void>();

  // Overrides the default 18px/16px responsive card radius with a fixed value,
  // for consumers (e.g. list rows) whose corner radius doesn't change with viewport.
  @Input() radius?: number;

  private readonly elementRef = inject(ElementRef<HTMLElement>);

  protected readonly offset = signal(0);
  protected readonly dragging = signal(false);

  @HostBinding('class.is-interactive')
  protected get isInteractive(): boolean {
    return this.dragging() || this.offset() !== 0;
  }

  @HostBinding('style.--action-width.px')
  protected readonly actionWidth = ACTION_WIDTH;

  @HostBinding('style.--radius.px')
  protected get radiusOverride(): number | null {
    return this.radius ?? null;
  }

  // Squares off the projected card's corner as it slides clear of the mask,
  // so it butts flush against the revealed action button instead of leaving a rounded gap.
  @HostBinding('style.--card-radius-right')
  protected get cardRadiusRight(): string | null {
    return this.offset() < 0 ? '0px' : null;
  }

  @HostBinding('style.--card-radius-left')
  protected get cardRadiusLeft(): string | null {
    return this.offset() > 0 ? '0px' : null;
  }

  private startX = 0;
  private startY = 0;
  private baseOffset = 0;
  private axisLocked: 'x' | 'y' | null = null;
  private pointerId: number | null = null;

  @HostListener('pointerdown', ['$event'])
  protected onPointerDown(event: PointerEvent): void {
    if (event.button !== 0) return;
    this.pointerId = event.pointerId;
    this.startX = event.clientX;
    this.startY = event.clientY;
    this.baseOffset = this.offset();
    this.axisLocked = null;
    this.dragging.set(true);
  }

  @HostListener('pointermove', ['$event'])
  protected onPointerMove(event: PointerEvent): void {
    if (!this.dragging() || event.pointerId !== this.pointerId) return;
    const dx = event.clientX - this.startX;
    const dy = event.clientY - this.startY;

    if (this.axisLocked === null) {
      if (Math.abs(dx) < AXIS_LOCK_THRESHOLD && Math.abs(dy) < AXIS_LOCK_THRESHOLD) return;
      this.axisLocked = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (this.axisLocked === 'x') {
        (event.currentTarget as Element).setPointerCapture(event.pointerId);
      }
    }
    if (this.axisLocked !== 'x') return;

    event.preventDefault();
    this.offset.set(this.clamp(this.baseOffset + dx));
  }

  @HostListener('pointerup', ['$event'])
  protected onPointerUp(event: PointerEvent): void {
    if (event.pointerId !== this.pointerId) return;
    this.finishDrag();
  }

  @HostListener('pointercancel', ['$event'])
  protected onPointerCancel(event: PointerEvent): void {
    if (event.pointerId !== this.pointerId) return;
    this.finishDrag();
  }

  @HostListener('document:pointerdown', ['$event'])
  protected onDocumentPointerDown(event: PointerEvent): void {
    if (this.offset() === 0) return;
    const target = event.target as Node;
    if (!this.elementRef.nativeElement.contains(target)) this.close();
  }

  protected close(): void {
    this.offset.set(0);
  }

  protected onDeleteClick(event: Event): void {
    event.stopPropagation();
    this.close();
    this.delete.emit();
  }

  protected onMoreClick(event: Event): void {
    event.stopPropagation();
    this.close();
    this.more.emit();
  }

  private finishDrag(): void {
    this.dragging.set(false);
    this.pointerId = null;
    this.axisLocked = null;
    const current = this.offset();
    if (current <= -OPEN_THRESHOLD) this.offset.set(-ACTION_WIDTH);
    else if (current >= OPEN_THRESHOLD) this.offset.set(ACTION_WIDTH);
    else this.offset.set(0);
  }

  private clamp(value: number): number {
    const max = ACTION_WIDTH + MAX_OVERDRAG;
    if (value > ACTION_WIDTH) value = ACTION_WIDTH + (value - ACTION_WIDTH) * OVERDRAG_RESISTANCE;
    else if (value < -ACTION_WIDTH) value = -ACTION_WIDTH + (value + ACTION_WIDTH) * OVERDRAG_RESISTANCE;
    return Math.max(-max, Math.min(max, value));
  }
}
