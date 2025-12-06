import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

/**
 * Sanitization utility for XSS protection
 */
export class SanitizationUtil {
  /**
   * Sanitize user input text (remove HTML tags)
   */
  static sanitizeText(text: string): string {
    if (!text) return '';
    
    // Remove HTML tags
    const div = document.createElement('div');
    div.textContent = text;
    return div.textContent || div.innerText || '';
  }

  /**
   * Sanitize HTML content using Angular's DomSanitizer
   */
  static sanitizeHtml(sanitizer: DomSanitizer, html: string): SafeHtml {
    if (!html) return sanitizer.sanitize(1, '') as SafeHtml;
    
    // Only allow safe HTML (Angular's default sanitization)
    return sanitizer.sanitize(1, html) as SafeHtml;
  }

  /**
   * Validate and sanitize username
   */
  static sanitizeUsername(username: string): string {
    if (!username) return '';
    
    // Remove any HTML tags and trim
    const sanitized = this.sanitizeText(username).trim();
    
    // Remove any potentially dangerous characters
    return sanitized.replace(/[<>\"'&]/g, '');
  }

  /**
   * Validate and sanitize message content
   */
  static sanitizeMessage(message: string): string {
    if (!message) return '';
    
    // Remove HTML tags but preserve newlines
    const sanitized = this.sanitizeText(message);
    
    // Remove any script-like content
    return sanitized.replace(/javascript:/gi, '').replace(/on\w+\s*=/gi, '');
  }

  /**
   * Validate base64 string (for public keys, etc.)
   */
  static isValidBase64(str: string): boolean {
    if (!str) return false;
    
    try {
      // Remove whitespace
      const cleaned = str.replace(/\s/g, '');
      
      // Check if it's valid base64
      const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
      if (!base64Regex.test(cleaned)) {
        return false;
      }
      
      // Try to decode
      atob(cleaned);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Escape special characters for safe display
   */
  static escapeHtml(text: string): string {
    if (!text) return '';
    
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }
}

