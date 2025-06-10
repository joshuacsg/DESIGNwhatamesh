declare module 'gradient' {
  export class Gradient {
    constructor();
    initGradient(selector: string): void;
    connect(): Promise<void>;
    play(): void;
    pause(): void;
    toggleColor(index: number): void;
  }
} 