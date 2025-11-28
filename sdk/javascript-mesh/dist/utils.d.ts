/**
 * Utility functions for SmaRTC Client
 */
export declare function generateId(): string;
export declare function calculateBandwidth(bytes: number, durationMs: number): number;
export declare function formatBytes(bytes: number): string;
export declare function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void;
export declare function throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void;
//# sourceMappingURL=utils.d.ts.map