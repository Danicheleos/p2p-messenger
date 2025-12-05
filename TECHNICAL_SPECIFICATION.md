# P2P Chat Messenger - Technical Specification

## 1. Project Overview

### 1.1 Purpose
Create a secure, peer-to-peer (P2P) messenger application that enables encrypted communication between users without relying on a central server for message routing. The application will use WebRTC for P2P connections and implement end-to-end encryption using SSH key pairs.

### 1.2 Key Features
- User authentication via username with automatic SSH key pair generation
- Peer-to-peer messaging with end-to-end encryption
- Contact management system
- File/image attachments
- Message history with local storage
- Dark and light theme support
- Responsive design for mobile and desktop

### 1.3 Security Goals
- End-to-end encryption for all messages
- Private keys never leave the client
- Protection against common web vulnerabilities (XSS, CSRF, injection attacks)
- Secure key storage in browser
- Message integrity verification

---

## 2. Technical Stack

### 2.1 Core Framework
- **Angular 20+**: Latest Angular framework with standalone components
- **TypeScript 5.9+**: Type-safe development
- **Signals API**: Use Angular Signals instead of RxJS Observables for reactive state management
  - `signal()` for state
  - `computed()` for derived state
  - `effect()` for side effects
  - Avoid `BehaviorSubject`, `Observable`, `Subject` from RxJS

### 2.2 UI Framework
- **Ionic 7+**: UI component library for mobile-first design
  - Components: `ion-button`, `ion-input`, `ion-card`, `ion-list`, `ion-item`, `ion-avatar`, `ion-icon`
  - Layout: `ion-grid`, `ion-row`, `ion-col`
  - Navigation: `ion-router-outlet`
  - Theming: CSS variables for theme customization

### 2.3 Styling
- **SCSS**: Preprocessor for CSS
  - Use SCSS variables for colors, spacing, typography
  - Implement BEM methodology for class naming
  - Component-scoped styles
  - Global theme variables in `src/styles.scss`

### 2.4 P2P Communication
- **WebRTC**: For peer-to-peer connections
  - `RTCPeerConnection` for establishing connections
  - `RTCDataChannel` for message transmission
  - ICE (Interactive Connectivity Establishment) for NAT traversal
  - STUN/TURN servers for connection establishment (optional, for NAT traversal)

### 2.5 Cryptography
- **Web Crypto API**: For encryption/decryption operations
  - `crypto.subtle.generateKey()` for key generation
  - `crypto.subtle.encrypt()` / `crypto.subtle.decrypt()` for message encryption
  - RSA-OAEP or AES-GCM for encryption algorithms
  - SHA-256 for hashing

### 2.6 Storage
- **IndexedDB**: For storing message history and contacts
  - Use `idb` library for IndexedDB wrapper (optional)
  - Store encrypted messages locally
  - Store user profile and keys securely

### 2.7 Additional Libraries
- **@ionic/angular**: Ionic Angular integration
- **@ionic/angular-toolkit**: Ionic development tools
- **crypto-js** (optional): If Web Crypto API needs fallback
- **idb** (optional): IndexedDB wrapper for easier API

---

## 3. Architecture

### 3.1 SOLID Principles

#### Single Responsibility Principle (SRP)
- Each service/component handles one responsibility
- Separate concerns: encryption, storage, P2P connection, UI rendering

#### Open/Closed Principle (OCP)
- Use interfaces for extensibility
- Abstract classes for common functionality
- Dependency injection for loose coupling

#### Liskov Substitution Principle (LSP)
- Interfaces define contracts
- Implementations are interchangeable

#### Interface Segregation Principle (ISP)
- Small, focused interfaces
- No forced implementation of unused methods

#### Dependency Inversion Principle (DIP)
- Depend on abstractions (interfaces), not concrete implementations
- Use Angular's dependency injection

### 3.2 Directory Structure

```markdown:TECHNICAL_SPECIFICATION.md
<code_block_to_apply_changes_from>
src/app/
├── core/                          # Core application logic
│   ├── interfaces/                # TypeScript interfaces
│   │   ├── user.interface.ts
│   │   ├── message.interface.ts
│   │   ├── contact.interface.ts
│   │   └── p2p-connection.interface.ts
│   ├── constants/                 # Constant values
│   │   ├── storage-keys.const.ts
│   │   ├── encryption.const.ts
│   │   └── app.const.ts
│   ├── services/                  # Core services
│   │   ├── encryption.service.ts  # Encryption/decryption logic
│   │   ├── storage.service.ts     # IndexedDB operations
│   │   ├── p2p.service.ts         # WebRTC connection management
│   │   ├── user.service.ts        # User management
│   │   ├── contact.service.ts     # Contact management
│   │   └── message.service.ts     # Message handling
│   ├── guards/                    # Route guards
│   │   ├── auth.guard.ts         # Authentication guard
│   │   └── connection.guard.ts   # Connection status guard
│   ├── interceptors/              # HTTP interceptors
│   │   ├── error.interceptor.ts  # Error handling
│   │   └── logging.interceptor.ts # Request/response logging
│   └── models/                    # Data models
│       ├── user.model.ts
│       ├── message.model.ts
│       └── contact.model.ts
│
├── pages/                         # Main page components
│   ├── login/                     # Login page
│   │   ├── login.component.ts
│   │   ├── login.component.html
│   │   └── login.component.scss
│   ├── chat/                      # Main chat page
│   │   ├── chat.component.ts
│   │   ├── chat.component.html
│   │   └── chat.component.scss
│   └── contacts/                  # Contacts management page (optional)
│       ├── contacts.component.ts
│       ├── contacts.component.html
│       └── contacts.component.scss
│
├── shared/                        # Shared components and utilities
│   ├── components/                # Reusable components
│   │   ├── message-bubble/       # Message display component
│   │   ├── contact-item/         # Contact list item
│   │   ├── file-attachment/      # File attachment preview
│   │   └── theme-toggle/        # Theme switcher
│   ├── pipes/                     # Custom pipes
│   │   ├── date-format.pipe.ts
│   │   └── truncate.pipe.ts
│   ├── directives/                # Custom directives
│   │   └── auto-focus.directive.ts
│   └── utils/                     # Utility functions
│       ├── encryption.util.ts
│       └── validation.util.ts
│
└── app.ts                         # Root component
```

### 3.3 Service Architecture

#### Encryption Service
- **Responsibility**: Handle all cryptographic operations
- **Methods**:
  - `generateKeyPair(): Promise<CryptoKeyPair>`
  - `encryptMessage(message: string, publicKey: CryptoKey): Promise<string>`
  - `decryptMessage(encryptedMessage: string, privateKey: CryptoKey): Promise<string>`
  - `exportPublicKey(key: CryptoKey): Promise<string>`
  - `importPublicKey(keyString: string): Promise<CryptoKey>`
  - `hashData(data: string): Promise<string>`

#### Storage Service
- **Responsibility**: Manage IndexedDB operations
- **Methods**:
  - `initDatabase(): Promise<void>`
  - `saveUser(user: User): Promise<void>`
  - `getUser(): Promise<User | null>`
  - `saveMessage(message: Message): Promise<void>`
  - `getMessages(contactId: string): Promise<Message[]>`
  - `saveContact(contact: Contact): Promise<void>`
  - `getContacts(): Promise<Contact[]>`
  - `deleteContact(contactId: string): Promise<void>`

#### P2P Service
- **Responsibility**: Manage WebRTC connections
- **Methods**:
  - `createConnection(contactId: string): Promise<RTCPeerConnection>`
  - `sendOffer(contactId: string): Promise<void>`
  - `handleOffer(offer: RTCSessionDescriptionInit, contactId: string): Promise<void>`
  - `sendAnswer(answer: RTCSessionDescriptionInit, contactId: string): Promise<void>`
  - `handleAnswer(answer: RTCSessionDescriptionInit, contactId: string): Promise<void>`
  - `sendMessage(message: string, contactId: string): Promise<void>`
  - `onMessage(contactId: string, callback: (message: string) => void): void`
  - `closeConnection(contactId: string): Promise<void>`

#### User Service
- **Responsibility**: Manage current user state
- **Signals**:
  - `currentUser: Signal<User | null>`
  - `isAuthenticated: Signal<boolean>`
- **Methods**:
  - `createUser(username: string): Promise<User>`
  - `loadUser(): Promise<User | null>`
  - `logout(): Promise<void>`

#### Contact Service
- **Responsibility**: Manage contacts
- **Signals**:
  - `contacts: Signal<Contact[]>`
  - `selectedContact: Signal<Contact | null>`
- **Methods**:
  - `addContact(username: string, publicKey: string): Promise<Contact>`
  - `removeContact(contactId: string): Promise<void>`
  - `selectContact(contactId: string): void`

#### Message Service
- **Responsibility**: Handle message operations
- **Signals**:
  - `messages: Signal<Message[]>`
  - `unreadCount: Signal<number>`
- **Methods**:
  - `sendMessage(text: string, contactId: string, attachment?: File): Promise<void>`
  - `loadMessages(contactId: string): Promise<void>`
  - `markAsRead(contactId: string): Promise<void>`

---

## 4. Security Considerations

### 4.1 Encryption
- **Key Generation**: Use Web Crypto API with RSA-OAEP (2048-bit) or AES-GCM (256-bit)
- **Key Storage**: Store private keys encrypted in IndexedDB using a master password (optional) or browser's secure storage
- **Key Exchange**: Public keys shared via secure channel (QR code, manual entry, or encrypted exchange)
- **Message Encryption**: Each message encrypted with recipient's public key
- **Message Integrity**: Include HMAC or signature for message verification

### 4.2 Protection Against Attacks

#### XSS (Cross-Site Scripting)
- Sanitize all user inputs using Angular's `DomSanitizer`
- Use Angular's built-in template escaping
- Content Security Policy (CSP) headers
- Avoid `innerHTML` with user content

#### CSRF (Cross-Site Request Forgery)
- Not applicable (no server-side requests), but implement token-based validation if needed

#### Injection Attacks
- Use parameterized queries for IndexedDB operations
- Validate and sanitize all inputs
- Type checking with TypeScript

#### Man-in-the-Middle (MITM)
- Verify public keys through secure channels
- Implement key fingerprint verification
- Show key fingerprints in UI for manual verification

#### Storage Security
- Encrypt sensitive data before storing
- Use secure storage mechanisms
- Implement data retention policies

### 4.3 Authentication Guard
- Protect routes requiring authentication
- Redirect to login if not authenticated
- Check user existence in storage

---

## 5. UI/UX Requirements

### 5.1 Theme System

#### Dark Theme
- Background: `#1a1a1a` or `#121212`
- Surface: `#2d2d2d` or `#1e1e1e`
- Text Primary: `#ffffff`
- Text Secondary: `#b0b0b0`
- Accent: `#4a9eff` or `#5b9bd5`
- Error: `#ff4444`
- Success: `#44ff44`

#### Light Theme
- Background: `#ffffff`
- Surface: `#f5f5f5`
- Text Primary: `#000000`
- Text Secondary: `#666666`
- Accent: `#0066cc` or `#007bff`
- Error: `#cc0000`
- Success: `#00cc00`

#### Implementation
- CSS variables in `styles.scss`
- Theme service to switch themes
- Persist theme preference in storage
- Use Ionic's theme system

### 5.2 Responsive Layout

#### Mobile Layout (< 768px)
- Sidebar: Hidden by default, toggleable via menu button
- Chat area: Full width
- Input: Fixed at bottom
- Messages: Stack vertically
- Touch-friendly buttons (min 44x44px)

#### Desktop Layout (>= 768px)
- Sidebar: Always visible (250-300px width)
- Chat area: Remaining width
- Input: Bottom of chat area
- Messages: Max width centered (optional)
- Hover states for interactive elements

#### Breakpoints
- Mobile: `< 768px`
- Tablet: `768px - 1024px`
- Desktop: `>= 1024px`

### 5.3 Component Design

#### Login Page
- Centered card layout
- Username input field
- "Generate Keys" button
- Loading indicator during key generation
- Error messages for validation
- Welcome message

#### Main Chat Page
- **Sidebar (Left)**:
  - User profile section at top
  - Search/filter contacts
  - Contact list (scrollable)
  - "Add Contact" button (floating action button or header button)
  - Theme toggle
  - Logout button
  
- **Chat Area (Main)**:
  - Header with contact name and status
  - Message history (scrollable, auto-scroll to bottom)
  - Message bubbles (sent/received styling)
  - Timestamp for messages
  - File attachment previews
  - Typing indicator (optional)
  
- **Input Area (Bottom)**:
  - Text input field
  - Attachment button (image icon)
  - Send button
  - Character counter (optional)
  - File preview before sending

---

## 6. Feature Specifications

### 6.1 Login Component

#### User Flow
1. User enters username (validation: 3-20 alphanumeric characters)
2. Click "Create Account" or "Generate Keys"
3. System generates RSA key pair (2048-bit)
4. Display loading indicator
5. Store user data in IndexedDB:
   - Username
   - Public key (exported as string)
   - Private key (encrypted, stored securely)
   - Created timestamp
6. Navigate to main chat page

#### Validation
- Username: 3-20 characters, alphanumeric + underscore/hyphen
- Check if username already exists (optional)
- Show error messages for invalid input

#### Storage Structure
```typescript
interface User {
  id: string;              // UUID or generated ID
  username: string;
  publicKey: string;       // Base64 encoded
  privateKey: string;      // Encrypted, Base64 encoded
  createdAt: Date;
}
```

### 6.2 Main Chat Page

#### Sidebar Features
- **Contact List**:
  - Display all contacts
  - Show contact username
  - Show last message preview
  - Show unread message count badge
  - Show online/offline status (if P2P connected)
  - Click to select contact and load chat
  
- **Add Contact Button**:
  - Opens modal/dialog
  - Input fields:
    - Contact username
    - Public key (text area or file upload)
  - Validation for public key format
  - Save contact to IndexedDB

#### Chat Area Features
- **Message Display**:
  - Sent messages: Right-aligned, accent color background
  - Received messages: Left-aligned, surface color background
  - Show sender username (for group chats, if implemented)
  - Show timestamp (relative: "2m ago" or absolute: "14:30")
  - Show delivery status (sent, delivered, read - if implemented)
  - Show encryption indicator (lock icon)
  
- **File Attachments**:
  - Image preview (thumbnail)
  - File name and size
  - Download button
  - Max file size: 10MB (configurable)
  - Supported formats: Images (JPEG, PNG, GIF, WebP)

#### Input Area Features
- **Text Input**:
  - Multi-line support
  - Character limit: 5000 characters
  - Auto-resize textarea
  - Placeholder: "Type a message..."
  
- **Attachment Button**:
  - File picker (images only initially)
  - Preview before sending
  - Remove attachment option
  - Show file size
  
- **Send Button**:
  - Enabled when text or attachment exists
  - Loading state during encryption/sending
  - Disabled when no connection

### 6.3 P2P Messaging

#### Connection Establishment
1. **Offer Creation**:
   - User A wants to message User B
   - User A creates RTCPeerConnection
   - User A creates offer via `createOffer()`
   - User A sends offer to User B (via signaling mechanism)

2. **Answer Creation**:
   - User B receives offer
   - User B creates RTCPeerConnection
   - User B creates answer via `createAnswer()`
   - User B sends answer to User A

3. **ICE Candidates**:
   - Exchange ICE candidates between peers
   - Establish direct connection

4. **Data Channel**:
   - Open RTCDataChannel for messaging
   - Set up message listeners

#### Signaling Mechanism
Since this is P2P without a server, options:
1. **Manual Exchange**: Users manually exchange connection data (QR code, copy-paste)
2. **WebSocket Server** (optional): Lightweight signaling server for connection setup only
3. **WebRTC Data Channels**: Use existing connection for new connections

**Recommended**: Start with manual exchange, add signaling server later if needed.

#### Message Flow
1. User types message and clicks send
2. Encrypt message with recipient's public key
3. Send encrypted message via RTCDataChannel
4. Recipient receives encrypted message
5. Decrypt message with recipient's private key
6. Display message in chat
7. Save message to local IndexedDB

#### Message Structure
```typescript
interface Message {
  id: string;                    // UUID
  senderId: string;              // User ID
  recipientId: string;           // Contact ID
  content: string;               // Encrypted message content
  attachment?: {
    type: 'image';
    data: string;                // Base64 or blob URL
    filename: string;
    size: number;
  };
  timestamp: Date;
  encrypted: boolean;
  delivered: boolean;
  read: boolean;
}
```

### 6.4 Local Storage

#### IndexedDB Schema

**Users Store**:
- Key: `id`
- Indexes: `username`

**Contacts Store**:
- Key: `id`
- Indexes: `username`, `userId`

**Messages Store**:
- Key: `id`
- Indexes: `senderId`, `recipientId`, `timestamp`, `conversationId` (composite)

**Conversations Store** (optional):
- Key: `id`
- Indexes: `userId`, `contactId`, `lastMessageTimestamp`

---

## 7. Implementation Details

### 7.1 Key Generation (Login)

```typescript
// Pseudocode
async generateKeyPair(): Promise<CryptoKeyPair> {
  return await crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256'
    },
    true,
    ['encrypt', 'decrypt']
  );
}
```

### 7.2 Message Encryption

```typescript
// Pseudocode
async encryptMessage(message: string, publicKey: CryptoKey): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const encrypted = await crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    publicKey,
    data
  );
  return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
}
```

### 7.3 P2P Connection Setup

```typescript
// Pseudocode
async createConnection(contactId: string): Promise<RTCPeerConnection> {
  const pc = new RTCPeerConnection({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' }
    ]
  });
  
  const dataChannel = pc.createDataChannel('messages', {
    ordered: true
  });
  
  // Set up event handlers
  pc.onicecandidate = (event) => {
    if (event.candidate) {
      // Send ICE candidate to peer
    }
  };
  
  dataChannel.onmessage = (event) => {
    // Handle received message
  };
  
  return pc;
}
```

### 7.4 Signal-Based State Management

```typescript
// Example: User Service with Signals
@Injectable({ providedIn: 'root' })
export class UserService {
  private _currentUser = signal<User | null>(null);
  
  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this._currentUser() !== null);
  
  async createUser(username: string): Promise<User> {
    const keyPair = await this.encryptionService.generateKeyPair();
    const publicKeyStr = await this.encryptionService.exportPublicKey(keyPair.publicKey);
    const privateKeyStr = await this.encryptionService.exportPrivateKey(keyPair.privateKey);
    
    const user: User = {
      id: crypto.randomUUID(),
      username,
      publicKey: publicKeyStr,
      privateKey: privateKeyStr,
      createdAt: new Date()
    };
    
    await this.storageService.saveUser(user);
    this._currentUser.set(user);
    
    return user;
  }
}
```

---

## 8. Testing Requirements

### 8.1 Unit Tests
- Service methods (encryption, storage, P2P)
- Component logic
- Utility functions
- Guards and interceptors

### 8.2 Integration Tests
- User creation flow
- Contact addition flow
- Message sending/receiving flow
- Theme switching
- Storage operations

### 8.3 E2E Tests (Optional)
- Complete user journey
- Cross-browser testing
- Mobile device testing

---

## 9. Documentation Requirements

### 9.1 Code Documentation
- JSDoc comments for all public methods
- Inline comments for complex logic
- README in each major directory
- Type definitions for all interfaces

### 9.2 User Documentation (`/docs/user`)
- **Getting Started Guide**:
  - Installation instructions
  - First-time setup
  - Creating an account
  - Adding contacts
  
- **User Manual**:
  - How to send messages
  - How to attach files
  - How to manage contacts
  - How to switch themes
  - Troubleshooting common issues
  
- **Security Guide**:
  - How encryption works
  - Key exchange process
  - Best practices
  - Privacy considerations

### 9.3 AI Documentation (`/docs/cursor`)
- **Architecture Overview**:
  - System design
  - Component relationships
  - Data flow diagrams
  
- **Development Guide**:
  - Setup instructions
  - Code style guide
  - Testing procedures
  - Deployment process
  
- **API Reference**:
  - Service APIs
  - Component APIs
  - Interface definitions
  
- **Extension Points**:
  - How to add new features
  - Plugin architecture (if applicable)
  - Customization options

---

## 10. Development Phases

### Phase 1: Foundation
- [ ] Project setup with Ionic
- [ ] Core services structure
- [ ] Storage service implementation
- [ ] Encryption service implementation
- [ ] Theme system setup

### Phase 2: Authentication
- [ ] Login component
- [ ] User service implementation
- [ ] Key generation and storage
- [ ] Auth guard implementation

### Phase 3: UI Components
- [ ] Main layout (sidebar + chat)
- [ ] Contact list component
- [ ] Message bubble component
- [ ] Input area component
- [ ] Theme toggle component

### Phase 4: Contact Management
- [ ] Contact service implementation
- [ ] Add contact functionality
- [ ] Contact list display
- [ ] Contact selection

### Phase 5: P2P Communication
- [ ] P2P service implementation
- [ ] WebRTC connection setup
- [ ] Signaling mechanism (manual exchange)
- [ ] Data channel implementation

### Phase 6: Messaging
- [ ] Message service implementation
- [ ] Message encryption/decryption
- [ ] Message sending/receiving
- [ ] Message history display
- [ ] File attachment support

### Phase 7: Polish & Security
- [ ] Security hardening
- [ ] Error handling
- [ ] Loading states
- [ ] Responsive design refinement
- [ ] Performance optimization

### Phase 8: Documentation
- [ ] Code documentation
- [ ] User documentation
- [ ] AI/Cursor documentation
- [ ] README updates

---

## 11. Performance Considerations

### 11.1 Optimization Strategies
- Lazy loading for routes
- Virtual scrolling for long message lists
- Image compression for attachments
- Debouncing for search inputs
- Caching for frequently accessed data

### 11.2 Bundle Size
- Tree-shaking unused code
- Code splitting
- Lazy load heavy dependencies
- Optimize images and assets

### 11.3 Storage Management
- Limit message history (e.g., last 1000 messages per conversation)
- Implement cleanup for old messages
- Compress stored data
- Index optimization for queries

---

## 12. Browser Compatibility

### 12.1 Required Features
- WebRTC API
- Web Crypto API
- IndexedDB API
- ES6+ JavaScript features
- CSS Grid/Flexbox

### 12.2 Supported Browsers
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

---

## 13. Future Enhancements (Out of Scope)

- Group chats
- Voice/video calls
- Message reactions
- Read receipts
- Typing indicators
- Message search
- Message editing/deletion
- Offline message queue
- Multi-device sync
- Backup/restore functionality

---

## 14. Glossary

- **P2P**: Peer-to-peer, direct communication between two clients
- **WebRTC**: Web Real-Time Communication API
- **ICE**: Interactive Connectivity Establishment
- **STUN**: Session Traversal Utilities for NAT
- **TURN**: Traversal Using Relays around NAT
- **RSA-OAEP**: RSA encryption with Optimal Asymmetric Encryption Padding
- **AES-GCM**: Advanced Encryption Standard with Galois/Counter Mode
- **IndexedDB**: Browser-based database for storing large amounts of structured data
- **Signal**: Angular's reactive primitive for state management
```

This specification covers:

1. **Project overview** — purpose and features
2. **Technical stack** — libraries and versions
3. **Architecture** — SOLID, directory structure, service design
4. **Security** — encryption, attack prevention, best practices
5. **UI/UX** — themes, responsive design, component specs
6. **Feature specs** — login, chat, P2P messaging, storage
7. **Implementation details** — code examples and patterns
8. **Testing** — unit, integration, E2E
9. **Documentation** — user and AI docs
10. **Development phases** — step-by-step plan
11. **Performance** — optimization strategies
12. **Browser compatibility** — supported browsers
13. **Future enhancements** — out-of-scope features

Use this as the technical specification for the P2P chat messenger project.
